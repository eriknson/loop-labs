// Enhanced AI integration using Dust AI principles for better persona generation
export interface EnhancedAIConfig {
  apiKey: string;
  useDustAI?: boolean;
}

export interface EnhancedAIResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export class EnhancedAIClient {
  private apiKey: string;
  private useDustAI: boolean;

  constructor(config: EnhancedAIConfig) {
    this.apiKey = config.apiKey;
    this.useDustAI = config.useDustAI || false;
  }

  // Generate enhanced persona using Dust AI principles
  async generatePersona(calendarData: any, userProfile?: any): Promise<EnhancedAIResponse> {
    try {
      // Enhanced prompt using Dust AI principles for better persona generation
      const enhancedPrompt = `You are an advanced AI persona analyst. Analyze the provided calendar data and generate a comprehensive, detailed persona profile.

CALENDAR DATA:
${JSON.stringify(calendarData.events || [], null, 2)}

USER PROFILE:
${JSON.stringify(userProfile || {}, null, 2)}

Generate a detailed persona that includes:

1. PROFESSIONAL ANALYSIS:
   - Work patterns and schedule preferences
   - Meeting frequency and collaboration style
   - Productivity patterns and peak hours
   - Industry and role insights

2. PERSONAL INSIGHTS:
   - Interests and hobbies (inferred from calendar events)
   - Social patterns and relationships
   - Work-life balance indicators
   - Personal goals and aspirations

3. BEHAVIORAL PATTERNS:
   - Time management style
   - Communication preferences
   - Decision-making patterns
   - Stress indicators and recovery patterns

4. PERSONALITY TRAITS:
   - Leadership style
   - Collaboration approach
   - Risk tolerance
   - Innovation mindset

5. GOALS AND OPPORTUNITIES:
   - Short-term objectives
   - Long-term aspirations
   - Growth opportunities
   - Areas for improvement

Format the response as a structured JSON object with these categories. Be specific, actionable, and insightful.`;

      // Use OpenAI with enhanced prompting (Dust AI principles)
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'You are an expert persona analyst with deep understanding of human behavior patterns, work psychology, and personal development. Generate comprehensive, actionable persona profiles.'
            },
            {
              role: 'user',
              content: enhancedPrompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `OpenAI API error: ${response.status} - ${errorText}`,
        };
      }

      const result = await response.json();
      const personaContent = result.choices[0]?.message?.content;

      if (!personaContent) {
        return {
          success: false,
          error: 'No persona content generated',
        };
      }

      // Try to parse as JSON, fallback to structured text
      let personaData;
      try {
        personaData = JSON.parse(personaContent);
      } catch {
        // If not JSON, create structured object from text
        personaData = {
          raw_analysis: personaContent,
          generated_at: new Date().toISOString(),
          source: 'enhanced_ai'
        };
      }

      return {
        success: true,
        data: personaData,
      };
    } catch (error) {
      return {
        success: false,
        error: `Enhanced AI error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  // Generate enhanced weekly digest using Dust AI principles
  async generateDigest(persona: any, calendarData: any): Promise<EnhancedAIResponse> {
    try {
      const enhancedPrompt = `You are an advanced AI digest generator. Create a personalized weekly digest based on the provided persona and calendar data.

PERSONA:
${JSON.stringify(persona, null, 2)}

CALENDAR DATA:
${JSON.stringify(calendarData.events || [], null, 2)}

Generate a comprehensive weekly digest that includes:

1. WEEKLY INSIGHTS:
   - Key accomplishments and highlights
   - Important meetings and outcomes
   - Productivity patterns and efficiency metrics
   - Work-life balance assessment

2. UPCOMING PRIORITIES:
   - Critical tasks and deadlines
   - Important meetings and preparation needs
   - Personal and professional goals alignment
   - Time management recommendations

3. GROWTH OPPORTUNITIES:
   - Learning and development suggestions
   - Skill enhancement recommendations
   - Networking and relationship building
   - Innovation and creativity opportunities

4. MOTIVATIONAL CONTENT:
   - Personalized encouragement and motivation
   - Success celebration and recognition
   - Challenge reframing and positive perspective
   - Goal reinforcement and momentum building

5. ACTIONABLE RECOMMENDATIONS:
   - Specific next steps and actions
   - Habit formation suggestions
   - Productivity improvements
   - Personal development strategies

Make the digest engaging, actionable, and deeply personalized. Use the persona insights to tailor every recommendation specifically to this individual.`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'You are an expert personal development coach and productivity consultant. Create engaging, actionable, and highly personalized weekly digests that inspire and guide users toward their goals.'
            },
            {
              role: 'user',
              content: enhancedPrompt
            }
          ],
          temperature: 0.8,
          max_tokens: 1500
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `OpenAI API error: ${response.status} - ${errorText}`,
        };
      }

      const result = await response.json();
      const digestContent = result.choices[0]?.message?.content;

      if (!digestContent) {
        return {
          success: false,
          error: 'No digest content generated',
        };
      }

      return {
        success: true,
        data: {
          content: digestContent,
          generated_at: new Date().toISOString(),
          source: 'enhanced_ai'
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Enhanced AI error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
}

// Export a default instance
export const enhancedAI = new EnhancedAIClient({
  apiKey: process.env.OPENAI_API_KEY || '',
  useDustAI: process.env.USE_DUST_AI === 'true'
});
