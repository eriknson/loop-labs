import { NextRequest, NextResponse } from 'next/server';
import { enhancedAI } from '@/lib/dust-ai';

export async function POST(request: NextRequest) {
  try {
    const { calendarData, userProfile } = await request.json();

    if (!calendarData) {
      return NextResponse.json(
        { error: 'Calendar data is required' },
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

    console.log('Generating enhanced persona with Dust AI principles...');
    
    // Generate persona using enhanced AI with Dust AI principles
    const result = await enhancedAI.generatePersona(calendarData, userProfile);

    if (!result.success) {
      console.error('Enhanced AI persona generation failed:', result.error);
      return NextResponse.json(
        { error: result.error || 'Failed to generate enhanced persona' },
        { status: 500 }
      );
    }

    console.log('Enhanced AI persona generated successfully');

    return NextResponse.json({
      success: true,
      persona: result.data,
      source: 'enhanced_ai',
    });

  } catch (error) {
    console.error('Enhanced AI persona generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate enhanced persona' },
      { status: 500 }
    );
  }
}
