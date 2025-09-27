'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Logo } from '@/components/Logo';
import LoadingScreen from '@/components/LoadingScreen';
import PersonaDisplay from '@/components/PersonaDisplay';
import { DigestPanel } from '@/components/DigestPanel';

interface FlowStep {
  id: string;
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  message?: string;
}

export default function AutomatedFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flowData, setFlowData] = useState<any>(null);
  const [personaPreview, setPersonaPreview] = useState<any>(null);
  const [showPersonaPreview, setShowPersonaPreview] = useState(false);
  const hasStartedRef = useRef(false);
  const requestInProgressRef = useRef(false);
  const [steps, setSteps] = useState<FlowStep[]>([
    { id: 'auth', name: 'Authenticating with Google', status: 'pending' },
    { id: 'calendar', name: 'Fetching Calendar Data', status: 'pending' },
    { id: 'persona', name: 'Generating Your Persona', status: 'pending' },
    { id: 'digest', name: 'Creating Weekly Digest', status: 'pending' },
    { id: 'calendar_invite', name: 'Adding to Your Calendar', status: 'pending' },
  ]);

  const accessToken = searchParams.get('access_token');
  const userEmail = searchParams.get('user_email');
  const userName = searchParams.get('user_name');

  const updateStep = useCallback((stepId: string, status: FlowStep['status'], message?: string) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, status, message }
        : step
    ));
  }, []);

  const startAutomatedFlow = useCallback(async () => {
    if (!accessToken) {
      setError('No access token found. Please authenticate first.');
      return;
    }

    if (hasStartedRef.current || requestInProgressRef.current) {
      return; // Prevent multiple executions
    }

    hasStartedRef.current = true;
    requestInProgressRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Fetch Calendar Data
      updateStep('auth', 'completed');
      updateStep('calendar', 'in_progress', 'Fetching your calendar events...');
      
      const calendarResponse = await fetch(`/api/calendar?accessToken=${encodeURIComponent(accessToken)}&monthsBack=6&insights=true`, {
        method: 'GET',
      });

      if (!calendarResponse.ok) {
        const errorData = await calendarResponse.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || 'Failed to fetch calendar data');
      }

      const calendarData = await calendarResponse.json();
      updateStep('calendar', 'completed', 'Calendar data fetched successfully');

      // Step 2: Run Automated Flow (Persona + Digest + Calendar Invite)
      updateStep('persona', 'in_progress', 'Analyzing your calendar patterns and creating your AI persona...');
      
      const flowResponse = await fetch('/api/automated-flow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessToken,
          calendarData: {
            now_iso: new Date().toISOString(),
            default_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            calendars: [{ id: 'primary', summary: 'Primary Calendar' }],
            events: calendarData.minified,
          },
        }),
      });

      if (!flowResponse.ok) {
        const errorData = await flowResponse.json();
        throw new Error(errorData.details || 'Automated flow failed');
      }

      const flowResult = await flowResponse.json();
      
      updateStep('persona', 'completed', 'Your AI persona is ready!');
      
      // Show persona preview first
      setPersonaPreview(flowResult.data.persona);
      setShowPersonaPreview(true);
      setCurrentStep(2); // Show persona preview
      
      // Wait a moment to let user see the persona, then continue
      setTimeout(() => {
        updateStep('digest', 'completed', 'Weekly digest created with personalized insights');
        updateStep('calendar_invite', 'completed', 'Added to your calendar for every Sunday!');
        
        // Set the flow data and show success screen
        setFlowData(flowResult.data);
        setShowPersonaPreview(false);
        setCurrentStep(4); // Show final results
        setIsLoading(false); // Make sure loading is false
      }, 3000); // 3 second preview

    } catch (err) {
      console.error('Automated flow error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      
      // Update current step to error
      updateStep('persona', 'error', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
      requestInProgressRef.current = false;
    }
  }, [accessToken, updateStep]);

  useEffect(() => {
    if (accessToken && !isLoading && !flowData && !hasStartedRef.current) {
      startAutomatedFlow();
    }
  }, [accessToken, isLoading, flowData, startAutomatedFlow]);

  if (!accessToken) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg border border-gray-200 p-8 text-center">
          <Logo />
          <h1 className="text-2xl font-semibold text-gray-900 mt-6 mb-4">
            Authentication Required
          </h1>
          <p className="text-gray-600 mb-6">
            Please authenticate with Google to start your automated flow.
          </p>
          <button
            onClick={() => router.push('/')}
            className="w-full bg-gray-900 text-white py-3 px-4 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-lg border border-gray-200 p-8">
          <Logo />
          <h1 className="text-2xl font-semibold text-gray-900 mt-6 mb-8 text-center">
            Setting Up Your Loop
          </h1>
          
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium ${
                  step.status === 'completed' 
                    ? 'bg-gray-900 text-white' 
                    : step.status === 'in_progress'
                    ? 'bg-gray-600 text-white animate-pulse'
                    : step.status === 'error'
                    ? 'bg-gray-800 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {step.status === 'completed' ? '✓' : 
                   step.status === 'error' ? '✗' : 
                   index + 1}
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${
                    step.status === 'completed' ? 'text-gray-900' :
                    step.status === 'in_progress' ? 'text-gray-700' :
                    step.status === 'error' ? 'text-gray-800' :
                    'text-gray-500'
                  }`}>
                    {step.name}
                  </p>
                  {step.message && (
                    <p className="text-sm text-gray-600">{step.message}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {error && (
            <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-gray-900 font-medium">Error:</p>
              <p className="text-gray-700 text-sm">{error}</p>
              <button
                onClick={startAutomatedFlow}
                className="mt-3 bg-gray-900 text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition-colors text-sm"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (showPersonaPreview && personaPreview) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <div className="text-center mb-8">
              <Logo />
              <h1 className="text-2xl font-semibold text-gray-900 mt-6 mb-2">
                Your AI Persona is Ready
              </h1>
              <p className="text-gray-600 mb-6">
                Here's what we discovered about your calendar patterns and preferences:
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <PersonaDisplay persona={personaPreview} />
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 text-gray-600 mb-4">
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                <span>Creating your weekly digest...</span>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                This will take just a moment while we generate your personalized insights.
              </p>
              <button
                onClick={() => {
                  setShowPersonaPreview(false);
                  setCurrentStep(4);
                }}
                className="text-sm text-gray-600 hover:text-gray-800 underline"
              >
                Continue to final results →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

        if (flowData) {
          return (
            <div className="min-h-screen bg-gray-50 p-4">
              <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-lg border border-gray-200 p-8 mb-6">
                  <div className="text-center mb-8">
                    <Logo />
                    <div className="mt-6 mb-4">
                      <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Successfully Added to Calendar
                      </h1>
                      <p className="text-lg text-gray-600 mb-2">
                        Welcome {userName}! Your personalized weekly digest is now running automatically.
                      </p>
                      <p className="text-gray-500">
                        Every Sunday at 9:00 AM, you'll receive your AI-generated insights and audio digest.
                      </p>
                    </div>
                  </div>

                  {/* 1. Persona Summary */}
                  <div className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Your AI Persona</h2>
                    <div className="bg-gray-50 rounded-lg p-6">
                      {flowData.persona?.persona_summary_120 ? (
                        <p className="text-gray-700 leading-relaxed">{flowData.persona.persona_summary_120}</p>
                      ) : (
                        <p className="text-gray-500">Persona summary not available</p>
                      )}
                    </div>
                  </div>

                  {/* 2. Audio Player */}
                  <div className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Weekly Audio Digest</h2>
                    <div className="bg-gray-50 rounded-lg p-6">
                      {flowData.audioUrl ? (
                        <div className="text-center">
                          <audio controls className="w-full max-w-md mx-auto">
                            <source src={flowData.audioUrl} type="audio/mpeg" />
                            Your browser does not support the audio element.
                          </audio>
                          <p className="text-sm text-gray-600 mt-2">Listen to your personalized weekly digest</p>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl text-gray-400">🎵</span>
                          </div>
                          <p className="text-gray-500">Audio is being generated...</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 3. Weekly Prompt */}
                  <div className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Weekly Digest</h2>
                    <div className="bg-gray-50 rounded-lg p-6">
                      {flowData.digest ? (
                        <div className="prose prose-gray max-w-none">
                          <div dangerouslySetInnerHTML={{ __html: flowData.digest.replace(/\n/g, '<br>') }} />
                        </div>
                      ) : (
                        <p className="text-gray-500">Digest content not available</p>
                      )}
                    </div>
                  </div>

                  {/* Calendar Event Info */}
                  <div className="mt-8 p-6 bg-gray-50 border border-gray-200 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Calendar Event Created Successfully
                    </h3>
                    <p className="text-gray-700 mb-4">
                      Your weekly digest has been automatically added to your Google Calendar.
                      You'll receive a notification every Sunday at 9 AM with your personalized insights and audio digest.
                    </p>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600"><strong>Event:</strong> {flowData.calendarEvent?.summary || 'Weekly AI Digest'}</p>
                        <p className="text-gray-600"><strong>When:</strong> Every Sunday at 9:00 AM</p>
                      </div>
                      <div>
                        <p className="text-gray-600"><strong>Duration:</strong> 30 minutes</p>
                        <p className="text-gray-600"><strong>Audio:</strong> {flowData.audioUrl ? 'Generated' : 'Processing...'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex justify-center space-x-4">
                    <button
                      onClick={() => router.push('/dashboard')}
                      className="bg-gray-900 text-white py-3 px-6 rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      View Admin Dashboard
                    </button>
                    <button
                      onClick={() => router.push('/')}
                      className="bg-gray-200 text-gray-800 py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Start Over
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        }

  return null;
}
