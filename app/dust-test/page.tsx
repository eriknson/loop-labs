'use client';

import { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';

export default function DustTestPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Test Dust AI persona generation
        const response = await fetch('/api/persona/dust', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            calendarData: {
              events: [
                {
                  summary: 'Team Meeting',
                  start: { dateTime: '2024-01-15T10:00:00Z' },
                  end: { dateTime: '2024-01-15T11:00:00Z' }
                },
                {
                  summary: 'Lunch with Sarah',
                  start: { dateTime: '2024-01-15T12:00:00Z' },
                  end: { dateTime: '2024-01-15T13:00:00Z' }
                }
              ]
            },
            userProfile: {
              name: 'Test User',
              email: 'test@example.com'
            }
          })
        });

        const data = await response.json();
        
        if (data.success) {
          setResult(data);
        } else {
          setError(data.error || 'Failed to generate persona');
        }
      } catch (err) {
        setError('Network error: ' + (err instanceof Error ? err.message : 'Unknown error'));
      } finally {
        setIsLoading(false);
      }
    },
    onError: (error) => {
      setError('Google login failed: ' + error.error);
    },
    scope: 'https://www.googleapis.com/auth/calendar.readonly'
  });

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Enhanced AI Integration Test
          </h1>
          
          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              Test the Enhanced AI integration for persona generation. This uses Dust AI principles with advanced prompting
              to generate more sophisticated and detailed AI personas from your calendar data.
            </p>
            
            <button
              onClick={() => googleLogin()}
              disabled={isLoading}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Testing Enhanced AI...' : 'Test Enhanced AI Persona Generation'}
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <h3 className="text-red-800 font-semibold mb-2">Error</h3>
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {result && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <h3 className="text-green-800 font-semibold mb-2">Success!</h3>
              <p className="text-green-700 mb-4">
                Enhanced AI persona generated successfully using {result.source}
              </p>
              <div className="bg-white rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Generated Persona:</h4>
                <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-auto max-h-96">
                  {JSON.stringify(result.persona, null, 2)}
                </pre>
              </div>
            </div>
          )}

          <div className="mt-8 p-6 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              What Enhanced AI Brings:
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li>• <strong>Advanced Persona Analysis:</strong> 5-category deep analysis (Professional, Personal, Behavioral, Personality, Goals)</li>
              <li>• <strong>Sophisticated Prompting:</strong> Dust AI principles for better context understanding</li>
              <li>• <strong>Structured Output:</strong> JSON-formatted, actionable insights</li>
              <li>• <strong>Enhanced Digests:</strong> More personalized and motivational weekly content</li>
              <li>• <strong>Better Pattern Recognition:</strong> Deeper analysis of work-life balance and productivity</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
