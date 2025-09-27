import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { requestThrottler } from '@/lib/request-throttler';
import { enhancedAI } from '@/lib/dust-ai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Cache for system prompts to avoid reading files repeatedly
const promptCache = new Map<string, string>();

// Simple hash function for cache keys
function generateHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

export async function POST(request: NextRequest) {
  try {
    const { accessToken, calendarData } = await request.json();
    
    if (!accessToken || !calendarData) {
      return NextResponse.json(
        { error: 'Access token and calendar data required' },
        { status: 400 }
      );
    }

    console.log('Starting automated flow for user...');
    console.log('Calendar data received:', {
      hasEvents: !!calendarData.events,
      eventCount: calendarData.events?.length || 0,
      hasMinified: !!calendarData.minified,
      minifiedCount: calendarData.minified?.length || 0
    });

    // Generate cache key based on calendar data to avoid duplicate processing
    const calendarHash = generateHash(JSON.stringify(calendarData));
    const userId = calendarData.userId || 'anonymous';

    // Step 1: Generate Persona (with caching)
    console.log('Step 1: Generating persona...');
    // Generate persona with Enhanced AI (preferred) or OpenAI (fallback)
    const useEnhancedAI = process.env.USE_DUST_AI === 'true';
    const personaResponse = await requestThrottler.throttle(
      `persona_${userId}_${calendarHash}`,
      useEnhancedAI ? 'enhanced_ai' : 'openai',
      () => useEnhancedAI ? generatePersonaWithEnhancedAI(calendarData) : generatePersona(calendarData),
      1800000 // 30 minutes cache
    );
    if (!personaResponse.success) {
      throw new Error(`Persona generation failed: ${personaResponse.error}`);
    }

    // Step 2: Generate Digest (with caching)
    console.log('Step 2: Generating digest...');
    const digestResponse = await requestThrottler.throttle(
      `digest_${userId}_${calendarHash}`,
      'openai',
      () => generateDigest(personaResponse.persona, calendarData),
      1800000 // 30 minutes cache
    );
    if (!digestResponse.success) {
      throw new Error(`Digest generation failed: ${digestResponse.error}`);
    }

    // Step 3: Create Calendar Invite (no caching, but rate limited)
    console.log('Step 3: Creating calendar invite...');
    const calendarInviteResponse = await requestThrottler.throttle(
      `calendar_invite_${userId}_${Date.now()}`,
      'google_calendar',
      () => createCalendarInvite(accessToken, digestResponse.digest, digestResponse.audioUrl),
      0 // No cache for calendar invites
    );
    if (!calendarInviteResponse.success) {
      throw new Error(`Calendar invite creation failed: ${calendarInviteResponse.error}`);
    }

    console.log('Automated flow completed successfully:', {
      personaGenerated: !!personaResponse.persona,
      digestGenerated: !!digestResponse.digest,
      audioUrl: digestResponse.audioUrl,
      calendarEventCreated: !!calendarInviteResponse.event,
      digestId: digestResponse.digestId
    });

    return NextResponse.json({
      success: true,
      message: 'Automated flow completed successfully',
      data: {
        persona: personaResponse.persona,
        digest: digestResponse.digest,
        audioUrl: digestResponse.audioUrl,
        calendarEvent: calendarInviteResponse.event,
        digestId: digestResponse.digestId
      }
    });

  } catch (error) {
    console.error('Automated flow error:', error);
    return NextResponse.json(
      { 
        error: 'Automated flow failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// Generate persona using Enhanced AI (Dust AI principles)
async function generatePersonaWithEnhancedAI(calendarData: any): Promise<{ success: boolean; persona?: any; error?: string }> {
  try {
    console.log('Generating persona with Enhanced AI (Dust AI principles)...');
    
    const result = await enhancedAI.generatePersona(calendarData);
    
    if (!result.success) {
      console.error('Enhanced AI persona generation failed:', result.error);
      return { success: false, error: result.error };
    }

    console.log('Enhanced AI persona generated successfully');
    return { success: true, persona: result.data };
  } catch (error) {
    console.error('Enhanced AI persona generation error:', error);
    return { success: false, error: 'Failed to generate persona with Enhanced AI' };
  }
}

async function generatePersona(calendarData: any) {
  try {
    // Get cached system prompt or read from file
    let cleanSystemPrompt = promptCache.get('persona_prompt');
    if (!cleanSystemPrompt) {
      const systemPromptPath = path.join(process.cwd(), 'loop-system-prompt.md');
      if (!fs.existsSync(systemPromptPath)) {
        throw new Error('System prompt file not found');
      }
      
      const systemPrompt = fs.readFileSync(systemPromptPath, 'utf8');
      cleanSystemPrompt = systemPrompt
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .replace(/#+\s*/g, '')
        .replace(/\*\*/g, '')
        .trim();
      
      promptCache.set('persona_prompt', cleanSystemPrompt);
    }

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_PERSONA_MODEL || 'gpt-4o',
      messages: [
        { role: 'system', content: cleanSystemPrompt },
        { role: 'user', content: JSON.stringify(calendarData) }
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Extract JSON from response
    let jsonContent = content.trim();
    const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonContent = jsonMatch[0];
    }

    const persona = JSON.parse(jsonContent);
    return { success: true, persona };
  } catch (error) {
    console.error('Persona generation error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function generateDigest(persona: any, calendarData: any) {
  try {
    // Get cached digest prompt or read from file
    let cleanDigestPrompt = promptCache.get('digest_prompt');
    if (!cleanDigestPrompt) {
      const digestPromptPath = path.join(process.cwd(), 'digest-prompt.md');
      if (!fs.existsSync(digestPromptPath)) {
        throw new Error('Digest prompt file not found');
      }
      
      const digestPrompt = fs.readFileSync(digestPromptPath, 'utf8');
      cleanDigestPrompt = digestPrompt
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .replace(/#+\s*/g, '')
        .replace(/\*\*/g, '')
        .trim();
      
      promptCache.set('digest_prompt', cleanDigestPrompt);
    }

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_DIGEST_MODEL || 'gpt-4o',
      messages: [
        { role: 'system', content: cleanDigestPrompt },
        { 
          role: 'user', 
          content: `Persona description:\n${JSON.stringify(persona, null, 2)}\n\nRecent Calendar JSON:\n${JSON.stringify(calendarData, null, 2)}` 
        }
      ],
      temperature: 0.7,
      max_tokens: 3000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Generate unique ID for this digest
    const digestId = uuidv4();
    
    // Generate audio first
    let finalAudioUrl = null;
    try {
      const audioResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/digest/audio/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          digestId,
          content: content // Use original content without audio link
        }),
      });

      if (audioResponse.ok) {
        const audioData = await audioResponse.json();
        finalAudioUrl = audioData.audioUrl;
        console.log('Audio generated successfully:', finalAudioUrl);
      } else {
        console.error('Audio generation failed:', await audioResponse.text());
      }
    } catch (error) {
      console.error('Audio generation failed:', error);
    }
    
    // Create digest content with audio link if available
    const audioLink = finalAudioUrl ? `🎧 Listen To Your Digest: ${finalAudioUrl}\n\n` : '';
    const digestContent = `${audioLink}${content}`;
    
    // Store digest record with audio URL
    try {
      const { storeDigest } = await import('@/lib/digest-storage');
      storeDigest(digestId, digestContent, finalAudioUrl);
    } catch (error) {
      console.error('Failed to store digest record:', error);
    }

    return { success: true, digest: digestContent, audioUrl: finalAudioUrl, digestId };
  } catch (error) {
    console.error('Digest generation error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function createCalendarInvite(accessToken: string, digestContent: string, audioUrl: string) {
  try {
    if (!accessToken) {
      throw new Error('Access token is required for calendar invite creation');
    }

    // Calculate next Sunday at 9 AM
    const now = new Date();
    const nextSunday = new Date(now);
    nextSunday.setDate(now.getDate() + (7 - now.getDay()) % 7);
    nextSunday.setHours(9, 0, 0, 0);
    
    // If it's already Sunday and past 9 AM, get next Sunday
    if (now.getDay() === 0 && now.getHours() >= 9) {
      nextSunday.setDate(nextSunday.getDate() + 7);
    }

    const startTime = nextSunday.toISOString();
    const endTime = new Date(nextSunday.getTime() + 30 * 60 * 1000).toISOString(); // 30 minutes

    // Create calendar event with digest content
    const event = {
      summary: '🎧 Your Weekly Digest - Loop Labs',
      description: digestContent,
      start: {
        dateTime: startTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: endTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      location: 'Loop Labs - Your Personal AI Assistant',
      attendees: [],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 10 },
          { method: 'email', minutes: 60 },
        ],
      },
      visibility: 'private',
      guestsCanModify: false,
      guestsCanInviteOthers: false,
      guestsCanSeeOtherGuests: false,
    };

    // Create the event via Google Calendar API
    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Calendar API error:', errorData);
      throw new Error(`Calendar API error: ${errorData.error?.message || `HTTP ${response.status}`}`);
    }

    const createdEvent = await response.json();
    console.log('Calendar event created successfully:', createdEvent.id);
    return { success: true, event: createdEvent };
  } catch (error) {
    console.error('Calendar invite creation error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
