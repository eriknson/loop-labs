import { NextRequest, NextResponse } from 'next/server';
import { enhancedAI } from '@/lib/dust-ai';

export async function POST(request: NextRequest) {
  try {
    const { persona, calendarData } = await request.json();

    if (!persona || !calendarData) {
      return NextResponse.json(
        { error: 'Persona and calendar data are required' },
        { status: 400 }
      );
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    console.log('Generating enhanced digest with Dust AI principles...');
    
    // Generate digest using enhanced AI with Dust AI principles
    const result = await enhancedAI.generateDigest(persona, calendarData);

    if (!result.success) {
      console.error('Enhanced AI digest generation failed:', result.error);
      return NextResponse.json(
        { error: result.error || 'Failed to generate enhanced digest' },
        { status: 500 }
      );
    }

    console.log('Enhanced AI digest generated successfully');

    return NextResponse.json({
      success: true,
      digest: result.data,
      source: 'enhanced_ai',
    });

  } catch (error) {
    console.error('Enhanced AI digest generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate enhanced digest' },
      { status: 500 }
    );
  }
}
