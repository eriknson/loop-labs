'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import NumberFlow from '@number-flow/react';

type StepStatus = 'pending' | 'active' | 'complete' | 'error';

// Custom component for animated text transitions using NumberFlow
function AnimatedText({ 
  text, 
  isActive, 
  className = '' 
}: { 
  text: string; 
  isActive: boolean; 
  className?: string; 
}) {
  const [currentText, setCurrentText] = useState(text);
  const [isAnimating, setIsAnimating] = useState(false);
  
  useEffect(() => {
    if (isActive && text !== currentText) {
      setIsAnimating(true);
      
      // Fade out current text
      setTimeout(() => {
        setCurrentText(text);
        // Fade in new text
        setTimeout(() => {
          setIsAnimating(false);
        }, 50);
      }, 250);
    } else if (isActive) {
      setCurrentText(text);
    }
  }, [text, isActive, currentText]);
  
  if (isActive) {
    return (
      <div 
        className={`gradient-text ${className}`}
        style={{
          opacity: isAnimating ? 0 : 1,
          transition: 'opacity 0.25s ease-in-out',
          color: '#ffffff'
        }}
      >
        {currentText}
      </div>
    );
  }
  
  return <div className={className}>{text}</div>;
}
type PipelineStepId = 'calendar' | 'persona' | 'digest' | 'audio' | 'event';

interface PipelineStep {
  id: PipelineStepId;
  title: string;
  description: string;
  status: StepStatus;
  error?: string | null;
}

const PIPELINE_TEMPLATE: Array<Omit<PipelineStep, 'status' | 'error'>> = [
  {
    id: 'calendar',
    title: 'Load calendar events',
    description: 'Pulling the last six months from Google Calendar',
  },
  {
    id: 'persona',
    title: 'Create Persona',
    description: 'Summarising your rhythms, rituals, and working style with GPT-4.1',
  },
  {
    id: 'digest',
    title: 'Write Weekly Digest',
    description: 'Weaving your recent storyline with GPT-5',
  },
  {
    id: 'audio',
    title: 'Record Audio Digest',
    description: "Generating Marcel's voice with ElevenLabs",
  },
  {
    id: 'event',
    title: 'Schedule Digest Session',
    description: 'Dropping everything into next Sunday with the audio link ready',
  },
];

const STEP_DESCRIPTIONS: Record<PipelineStepId, string[]> = {
  calendar: [
    'Pulling the last six months from Google Calendar',
    'Analyzing your event patterns',
    'Counting meetings, calls, and appointments',
    'Mapping your schedule rhythms',
    'Synced with Google Calendar API',
  ],
  persona: [
    'Summarising your rhythms, rituals, and working style',
    'Detecting your work patterns and preferences',
    'Understanding your meeting habits',
    'Building your unique profile',
    'Generated with GPT-4o',
  ],
  digest: [
    'Weaving your recent storyline with GPT-5',
    'Connecting the dots in your calendar',
    'Finding narrative threads in your events',
    'Crafting your weekly story',
    'Written with GPT-5 Responses API',
  ],
  audio: [
    "Generating Marcel's voice with ElevenLabs",
    'Converting text to speech',
    'Adding French accent warmth',
    'Optimizing audio quality',
    'Recorded with ElevenLabs v3',
  ],
  event: [
    'Dropping everything into next Sunday with the audio link ready',
    'Calculating next Sunday at 3 PM',
    'Formatting the digest for calendar',
    'Adding the audio link to description',
    'Scheduled via Google Calendar API',
  ],
};

const createInitialSteps = (): PipelineStep[] =>
  PIPELINE_TEMPLATE.map((step) => ({
    ...step,
    status: 'pending',
    error: null,
  }));

interface CalendarPayload {
  success: boolean;
  events: any[];
  minified: any[];
  insights: string[];
  timeframe: { start: string; end: string } | null;
  count: number;
  monthsBack: number;
}

interface DigestResult {
  content: string;
  digestId: string;
  audioUrl: string;
}

interface AudioGenerationResult {
  audioUrl: string;
  digestId: string;
}

export default function Dashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const [steps, setSteps] = useState<PipelineStep[]>(() => createInitialSteps());
  const [calendarPayload, setCalendarPayload] = useState<CalendarPayload | null>(null);
  const [persona, setPersona] = useState<any | null>(null);
  const [digestResult, setDigestResult] = useState<DigestResult | null>(null);
  const [audioDataUrl, setAudioDataUrl] = useState<string | null>(null);
  const [calendarEvent, setCalendarEvent] = useState<any | null>(null);

  const [isRunning, setIsRunning] = useState(false);
  const [pipelineError, setPipelineError] = useState<string | null>(null);
  const [hasRun, setHasRun] = useState(false);

  const [activeStepDescriptions, setActiveStepDescriptions] = useState<Record<PipelineStepId, number>>({
    calendar: 0,
    persona: 0,
    digest: 0,
    audio: 0,
    event: 0,
  });

  const [expandedSteps, setExpandedSteps] = useState<Set<PipelineStepId>>(new Set());

  const isRunningRef = useRef(false);

  const retryWithBackoff = useCallback(async (fn: () => Promise<any>, maxRetries = 3) => {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        if (error instanceof Error && 
            (error.message.includes('429') || error.message.includes('Rate limit'))) {
          if (attempt < maxRetries - 1) {
            const delay = Math.pow(2, attempt) * 1000; // Exponential backoff: 1s, 2s, 4s
            console.log(`Rate limit hit, retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }
        throw error;
      }
    }
  }, []);

  const toggleStepExpansion = useCallback((stepId: PipelineStepId) => {
    setExpandedSteps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stepId)) {
        newSet.delete(stepId);
      } else {
        newSet.add(stepId);
      }
      return newSet;
    });
  }, []);

  // Universal content renderer that safely handles any data type
  const renderSafeContent = useCallback((data: any, title: string, maxHeight = 'max-h-64') => {
    if (!data) return null;

    return (
      <div className="mt-4 p-4 bg-gray-50 rounded-lg w-full">
        <h4 className="font-semibold mb-2">{title}</h4>
        <div className={`text-sm bg-white p-3 rounded border ${maxHeight} overflow-auto w-full`}>
          {typeof data === 'string' ? (
            <div className="whitespace-pre-wrap">{data}</div>
          ) : Array.isArray(data) ? (
            <div className="space-y-2">
              {data.map((item, index) => (
                <div key={index} className="p-2 bg-gray-50 rounded">
                  {typeof item === 'string' ? (
                    <div className="whitespace-pre-wrap">{item}</div>
                  ) : (
                    <pre className="text-xs">{JSON.stringify(item, null, 2)}</pre>
                  )}
                </div>
              ))}
            </div>
          ) : typeof data === 'object' ? (
            <div className="space-y-3">
              {Object.entries(data).map(([key, value]) => (
                <div key={key}>
                  <h5 className="font-medium text-gray-800 capitalize mb-1">
                    {key.replace(/_/g, ' ')}
                  </h5>
                  <div className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                    {typeof value === 'string' ? (
                      <div className="whitespace-pre-wrap">{value}</div>
                    ) : typeof value === 'object' ? (
                      <pre className="text-xs">{JSON.stringify(value, null, 2)}</pre>
                    ) : (
                      <span>{String(value)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <span>{String(data)}</span>
          )}
        </div>
      </div>
    );
  }, []);

  const renderStepContent = useCallback((stepId: PipelineStepId) => {
    switch (stepId) {
      case 'calendar':
        return renderSafeContent(
          calendarPayload,
          `Calendar Events (${Array.isArray(calendarPayload) ? calendarPayload.length : 'Data loaded'})`
        );
      
      case 'persona':
        return renderSafeContent(persona, 'Generated Persona');
      
      case 'digest':
        return renderSafeContent(digestResult, 'Weekly Digest');
      
      case 'audio':
        return audioDataUrl ? (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg w-full">
            <h4 className="font-semibold mb-2">Audio Digest</h4>
            <audio controls className="w-full">
              <source src={audioDataUrl} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
            <p className="text-xs text-gray-600 mt-2">Generated with ElevenLabs v3</p>
          </div>
        ) : null;
      
      case 'event':
        return renderSafeContent(calendarEvent, 'Calendar Event Created');
      
      default:
        return null;
    }
  }, [calendarPayload, persona, digestResult, audioDataUrl, calendarEvent, renderSafeContent]);

  useEffect(() => {
    const token = searchParams.get('access_token');
    const userEmailParam = searchParams.get('user_email');
    const userNameParam = searchParams.get('user_name');
    const authErrorParam = searchParams.get('error');

    if (authErrorParam) {
      setAuthError(`Authentication failed: ${authErrorParam}`);
      return;
    }

    if (token) {
      setAuthError(null);
      setAccessToken(token);
      setUserEmail(userEmailParam);
      setUserName(userNameParam);
      setHasRun(false);

      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', token);
        if (userEmailParam) {
          localStorage.setItem('userEmail', userEmailParam);
        }
        if (userNameParam) {
          localStorage.setItem('userName', userNameParam);
        }

        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete('access_token');
        cleanUrl.searchParams.delete('refresh_token');
        cleanUrl.searchParams.delete('user_email');
        cleanUrl.searchParams.delete('user_name');
        window.history.replaceState({}, '', cleanUrl.toString());
      }

      return;
    }

    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('accessToken');
      if (storedToken) {
        setAuthError(null);
        setAccessToken(storedToken);
        setUserEmail(localStorage.getItem('userEmail'));
        setUserName(localStorage.getItem('userName'));
        setHasRun(false);
      } else {
        router.push('/');
      }
    }
  }, [searchParams, router]);

  const executeStep = useCallback(async <T,>(stepId: PipelineStepId, action: () => Promise<T>): Promise<T> => {
    setSteps((prev) =>
      prev.map((step) =>
        step.id === stepId
          ? {
              ...step,
              status: 'active',
              error: null,
            }
          : step
      )
    );

    // Start description animation for this step
    const descriptions = STEP_DESCRIPTIONS[stepId];
    let descriptionIndex = 0;
    
    const descriptionInterval = setInterval(() => {
      setActiveStepDescriptions(prev => ({
        ...prev,
        [stepId]: descriptionIndex
      }));
      descriptionIndex = (descriptionIndex + 1) % descriptions.length;
    }, 2000);

    try {
      const result = await action();

      clearInterval(descriptionInterval);
      
      setSteps((prev) =>
        prev.map((step) =>
          step.id === stepId
            ? {
                ...step,
                status: 'complete',
              }
            : step
        )
      );

      return result;
    } catch (error) {
      clearInterval(descriptionInterval);
      
      let errorMessage = 'Something went wrong';
      if (error instanceof Error) {
        if (error.message.includes('429') || error.message.includes('Rate limit')) {
          errorMessage = 'Rate limit reached. Please wait a moment and try again.';
        } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          errorMessage = 'Authentication failed. Please reconnect with Google.';
        } else if (error.message.includes('500') || error.message.includes('Internal Server Error')) {
          errorMessage = 'Server error. Please try again.';
        } else {
          errorMessage = error.message;
        }
      }

      setSteps((prev) =>
        prev.map((step) =>
          step.id === stepId
            ? {
                ...step,
                status: 'error',
                error: errorMessage,
              }
            : step
        )
      );

      throw error;
    }
  }, []);

  const buildEventDescription = useCallback((content: string, audioPageUrl: string) => {
    const absoluteAudioUrl =
      typeof window !== 'undefined'
        ? audioPageUrl.startsWith('http')
          ? audioPageUrl
          : `${window.location.origin}${audioPageUrl}`
        : audioPageUrl;

    const withAudioLink = content.includes('🎧 Listen To Your Digest:')
      ? content.replace(
          /🎧 Listen To Your Digest: (\/digest\/[^\s]+)/g,
          `🎧 Listen To Your Digest: ${absoluteAudioUrl}`
        )
      : `🎧 Listen To Your Digest: ${absoluteAudioUrl}\n\n${content}`;

    return withAudioLink.replace(/https?:\/\/[^\s]+/g, (url) => {
      try {
        const domain = new URL(url).hostname.replace('www.', '');
        return `${domain}: ${url}`;
      } catch {
        return url;
      }
    });
  }, []);

  const runPipeline = useCallback(async () => {
    if (!accessToken) {
      return;
    }

    if (isRunningRef.current) {
      return;
    }

    isRunningRef.current = true;
    setIsRunning(true);
    setPipelineError(null);
    setSteps(createInitialSteps());
    setCalendarPayload(null);
    setPersona(null);
    setDigestResult(null);
    setAudioDataUrl(null);
    setCalendarEvent(null);

    try {
      const calendar = await executeStep('calendar', async () => {
        const response = await fetch(
          `/api/calendar?accessToken=${encodeURIComponent(accessToken)}&monthsBack=6&insights=true`
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));

          if (response.status === 401 || response.status === 403) {
            if (typeof window !== 'undefined') {
              localStorage.removeItem('accessToken');
              localStorage.removeItem('userEmail');
              localStorage.removeItem('userName');
            }

            router.push('/');
          }

          throw new Error(errorData.message || errorData.error || `Failed to fetch calendar (${response.status})`);
        }

        const payload: CalendarPayload = await response.json();
        setCalendarPayload(payload);
        return payload;
      });

      const personaData = await executeStep('persona', async () => {
        if (!calendar.minified?.length) {
          throw new Error('No calendar events available to build a persona yet.');
        }

        return await retryWithBackoff(async () => {
          const response = await fetch('/api/persona', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              calendarData: {
                now_iso: new Date().toISOString(),
                default_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                calendars: [{ id: 'primary', summary: 'Primary Calendar' }],
                events: calendar.minified,
              },
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.details || 'Failed to generate persona');
          }

          return await response.json();
        });
      });

      setPersona(personaData);

      const digest = await executeStep('digest', async () => {
        const response = await fetch('/api/digest', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            personaText: JSON.stringify(personaData, null, 2),
            recentCalendarJson: JSON.stringify(calendar.minified, null, 2),
            promptTemplate:
              'Run the Sunday digest.\n\nPersona description:\n{{persona_text}}\n\nRecent Calendar JSON:\n{{recent_calendar_json}}',
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || errorData.details || 'Failed to generate digest');
        }

        const digestPayload: DigestResult = await response.json();
        setDigestResult(digestPayload);
        return digestPayload;
      });

      await executeStep('audio', async () => {
        const response = await fetch('/api/digest/audio/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            digestId: digest.digestId,
            content: digest.content,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to generate audio');
        }

        const audioPayload: AudioGenerationResult = await response.json();
        setAudioDataUrl(audioPayload.audioUrl);
        return audioPayload;
      });

      await executeStep('event', async () => {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const now = new Date();
        const daysUntilSunday = (7 - now.getDay()) % 7;
        const nextSunday = new Date(now);
        nextSunday.setDate(now.getDate() + (daysUntilSunday === 0 ? 7 : daysUntilSunday));
        nextSunday.setHours(15, 0, 0, 0);

        const description = buildEventDescription(digest.content, digest.audioUrl);

        const eventData = {
          summary: 'Circling Back',
          location: 'by Loop',
          description,
          start: {
            dateTime: nextSunday.toISOString(),
            timeZone: timezone,
          },
          end: {
            dateTime: new Date(nextSunday.getTime() + 60 * 60 * 1000).toISOString(),
            timeZone: timezone,
          },
        };

        const response = await fetch('/api/calendar', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            accessToken,
            eventData,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to create calendar event');
        }

        const result = await response.json();
        setCalendarEvent(result.event);
        return result.event;
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Something went wrong while orchestrating the flow';
      setPipelineError(message);
    } finally {
      setIsRunning(false);
      isRunningRef.current = false;
    }
  }, [accessToken, executeStep, buildEventDescription, router]);

  useEffect(() => {
    if (!accessToken || hasRun) {
      return;
    }

    setHasRun(true);
    runPipeline();
  }, [accessToken, hasRun, runPipeline]);

  const handleSignOut = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userName');
    }

    setAccessToken(null);
    setUserEmail(null);
    setUserName(null);
    router.push('/');
  }, [router]);

  const pipelineComplete = useMemo(() => steps.every((step) => step.status === 'complete'), [steps]);
  const hasFailure = useMemo(() => steps.some((step) => step.status === 'error'), [steps]);

  const activeStep = useMemo(() => steps.find((step) => step.status === 'active'), [steps]);
  const erroredStep = useMemo(() => steps.find((step) => step.status === 'error'), [steps]);
  const lastCompletedStep = useMemo(
    () =>
      [...steps]
        .reverse()
        .find((step) => step.status === 'complete'),
    [steps]
  );

  const displayStep = activeStep ?? erroredStep ?? lastCompletedStep ?? steps[0];

  const timeframeLabel = useMemo(() => {
    if (!calendarPayload?.timeframe) {
      return null;
    }

    const { start, end } = calendarPayload.timeframe;
    return `${new Date(start).toLocaleDateString()} – ${new Date(end).toLocaleDateString()}`;
  }, [calendarPayload]);

  const digestPageUrl = useMemo(() => {
    if (!digestResult) {
      return null;
    }

    if (digestResult.audioUrl.startsWith('http')) {
      return digestResult.audioUrl;
    }

    if (typeof window === 'undefined') {
      return digestResult.audioUrl;
    }

    return `${window.location.origin}${digestResult.audioUrl}`;
  }, [digestResult]);

  const eventStartLabel = useMemo(() => {
    if (!calendarEvent) {
      return null;
    }

    const start = calendarEvent.start?.dateTime || calendarEvent.start?.date;
    if (!start) {
      return null;
    }

    return new Date(start).toLocaleString(undefined, {
      weekday: 'long',
      hour: 'numeric',
      minute: '2-digit',
      month: 'long',
      day: 'numeric',
    });
  }, [calendarEvent]);

  const detailContent = useMemo(() => {
    if (!displayStep) {
      return null;
    }

    switch (displayStep.id) {
      case 'calendar':
        return (
          <div className="space-y-4 rounded-lg border border-black bg-white p-6">
            <h2 className="text-lg font-semibold uppercase tracking-wide text-black">Calendar Synced</h2>
            {calendarPayload ? (
              <>
                <p className="text-sm text-gray-700">
                  Pulled {calendarPayload.count.toLocaleString()} events
                  {timeframeLabel ? ` from ${timeframeLabel}` : ''}.
                </p>
                {calendarPayload.insights?.length ? (
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Signals I Noticed</h3>
                    <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
                      {calendarPayload.insights.map((insight, index) => (
                        <li key={`${insight}-${index}`}>{insight}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Listening for patterns…</p>
                )}
              </>
            ) : (
              <p className="text-sm text-gray-500">Fetching calendar history…</p>
            )}
          </div>
        );
      case 'persona':
        return (
          <div className="space-y-4 rounded-lg border border-black bg-white p-6">
            <h2 className="text-lg font-semibold uppercase tracking-wide text-black">Persona Crafted</h2>
            {persona ? (
              <>
                <p className="text-sm text-gray-700">{persona.persona_summary_120}</p>
                <div className="grid gap-4 sm:grid-cols-2 text-sm">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Profile</p>
                    <p className="text-gray-700">Role type: {persona.profile?.role_type || 'unknown'}</p>
                    <p className="text-gray-700">Field: {persona.profile?.field || 'unknown'}</p>
                    <p className="text-gray-700">
                      Home base:{' '}
                      {persona.profile?.home_base?.city || 'unknown'},{' '}
                      {persona.profile?.home_base?.country || 'unknown'}
                    </p>
                    <p className="text-gray-700">
                      Timezone: {persona.profile?.primary_timezone || 'unknown'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Rhythm</p>
                    <p className="text-gray-700">
                      Typical start: {persona.profile?.typical_day_start_local || 'unknown'}
                    </p>
                    <p className="text-gray-700">
                      Wind down: {persona.profile?.typical_day_end_local || 'unknown'}
                    </p>
                    <p className="text-gray-700">
                      Quiet hours: {persona.profile?.quiet_hours || 'unknown'}
                    </p>
                  </div>
                </div>
                {persona.profile?.interests_tags?.length ? (
                  <div className="space-y-2 text-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Signals</p>
                    <div className="flex flex-wrap gap-2">
                      {persona.profile.interests_tags.map((tag: string) => (
                        <span
                          key={tag}
                          className="border border-black px-3 py-1 text-xs font-medium uppercase tracking-wide text-black"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </>
            ) : (
              <p className="text-sm text-gray-500">Synthesising persona…</p>
            )}
          </div>
        );
      case 'digest':
        return null;
      case 'audio':
        return (
          <div className="space-y-4 rounded-lg border border-black bg-white p-6">
            <h2 className="text-lg font-semibold uppercase tracking-wide text-black">Audio Session Ready</h2>
            {audioDataUrl ? (
              <div className="space-y-3">
                <audio controls src={audioDataUrl} className="w-full" />
                <p className="text-sm text-gray-700">
                  Marcel recorded your digest. Share the digest link or play it straight from here.
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Generating Marcel's recording…</p>
            )}
          </div>
        );
      case 'event':
        return (
          <div className="space-y-4 rounded-lg border border-black bg-white p-6">
            <h2 className="text-lg font-semibold uppercase tracking-wide text-black">Calendar Event Scheduled</h2>
            {calendarEvent ? (
              <div className="space-y-3 text-sm text-gray-700">
                <p>
                  Scheduled for <span className="font-semibold">{eventStartLabel || 'next Sunday'}</span>
                </p>
                <p>Title: {calendarEvent.summary || 'Circling Back'}</p>
                {calendarEvent.htmlLink ? (
                  <a
                    href={calendarEvent.htmlLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-black underline"
                  >
                    Open in Google Calendar
                  </a>
                ) : null}
                <p className="text-xs text-gray-500">
                  The audio link lives in the description so Sunday prep is one click away.
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Adding the digest to your calendar…</p>
            )}
          </div>
        );
      default:
        return null;
    }
  }, [
    displayStep,
    calendarPayload,
    persona,
    digestResult,
    audioDataUrl,
    calendarEvent,
    timeframeLabel,
    digestPageUrl,
    eventStartLabel,
  ]);

  if (authError) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-20 backdrop-blur-md bg-white/80 border-b border-black/10">
          <div className="px-6 py-4">
            <div className="flex items-center space-x-2">
              <svg className="w-6 h-6" viewBox="0 0 23.5703 21.5332" fill="black">
                <path d="M7.61523 7.28711C9.63867 7.28711 11.2656 5.64648 11.2656 3.63672C11.2656 1.62695 9.63867 0 7.61523 0C5.60547 0 3.97852 1.62695 3.97852 3.63672C3.97852 5.64648 5.60547 7.28711 7.61523 7.28711ZM7.61523 5.30469C6.69922 5.30469 5.94727 4.55273 5.94727 3.63672C5.94727 2.7207 6.69922 1.96875 7.61523 1.96875C8.54492 1.96875 9.29688 2.7207 9.29688 3.63672C9.29688 4.55273 8.54492 5.30469 7.61523 5.30469ZM15.5996 7.28711C17.6094 7.28711 19.2363 5.64648 19.2363 3.63672C19.2363 1.62695 17.6094 0 15.5996 0C13.5898 0 11.9492 1.62695 11.9492 3.63672C11.9492 5.64648 13.5898 7.28711 15.5996 7.28711ZM15.5996 5.30469C14.6836 5.30469 13.9316 4.55273 13.9316 3.63672C13.9316 2.7207 14.6836 1.96875 15.5996 1.96875C16.5156 1.96875 17.2676 2.7207 17.2676 3.63672C17.2676 4.55273 16.5156 5.30469 15.5996 5.30469ZM3.65039 14.4102C5.66016 14.4102 7.28711 12.7695 7.28711 10.7598C7.28711 8.75 5.66016 7.10938 3.65039 7.10938C1.62695 7.10938 0 8.75 0 10.7598C0 12.7695 1.62695 14.4102 3.65039 14.4102ZM3.65039 12.4277C2.7207 12.4277 1.96875 11.6758 1.96875 10.7598C1.96875 9.84375 2.7207 9.0918 3.65039 9.0918C4.56641 9.0918 5.31836 9.84375 5.31836 10.7598C5.31836 11.6758 4.56641 12.4277 3.65039 12.4277ZM19.5781 14.4102C21.5879 14.4102 23.2148 12.7695 23.2148 10.7598C23.2148 8.75 21.5879 7.10938 19.5781 7.10938C17.5684 7.10938 15.9277 8.75 15.9277 10.7598C15.9277 12.7695 17.5684 14.4102 19.5781 14.4102ZM19.5781 12.4277C18.6484 12.4277 17.8965 11.6758 17.8965 10.7598C17.8965 9.84375 18.6484 9.0918 19.5781 9.0918C20.4941 9.0918 21.2461 9.84375 21.2461 10.7598C21.2461 11.6758 20.4941 12.4277 19.5781 12.4277ZM7.61523 21.5332C9.63867 21.5332 11.2656 19.9062 11.2656 17.8965C11.2656 15.8867 9.63867 14.2461 7.61523 14.2461C5.60547 14.2461 3.97852 15.8867 3.97852 17.8965C3.97852 19.9062 5.60547 21.5332 7.61523 21.5332ZM7.61523 19.5645C6.69922 19.5645 5.94727 18.8125 5.94727 17.8965C5.94727 16.9805 6.69922 16.2285 7.61523 16.2285C8.54492 16.2285 9.29688 16.9805 9.29688 17.8965C9.29688 18.8125 8.54492 19.5645 7.61523 19.5645ZM15.5996 21.5332C17.6094 21.5332 19.2363 19.9062 19.2363 17.8965C19.2363 15.8867 17.6094 14.2461 15.5996 14.2461C13.5898 14.2461 11.9492 15.8867 11.9492 17.8965C11.9492 19.9062 13.5898 21.5332 15.5996 21.5332ZM15.5996 19.5645C14.6836 19.5645 13.9316 18.8125 13.9316 17.8965C13.9316 16.9805 14.6836 16.2285 15.5996 16.2285C16.5156 16.2285 17.2676 16.9805 17.2676 17.8965C17.2676 18.8125 16.5156 19.5645 15.5996 19.5645Z"/>
              </svg>
              <span className="text-xl font-bold text-black">Loop</span>
            </div>
          </div>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center pt-20">
          <h1 className="text-2xl font-semibold text-black">Authentication Error</h1>
          <p className="mt-4 text-sm text-gray-600">{authError}</p>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="mt-6 minimal-button"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!accessToken) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-20 backdrop-blur-md bg-white/80 border-b border-black/10">
          <div className="px-6 py-4">
            <div className="flex items-center space-x-2">
              <svg className="w-6 h-6" viewBox="0 0 23.5703 21.5332" fill="black">
                <path d="M7.61523 7.28711C9.63867 7.28711 11.2656 5.64648 11.2656 3.63672C11.2656 1.62695 9.63867 0 7.61523 0C5.60547 0 3.97852 1.62695 3.97852 3.63672C3.97852 5.64648 5.60547 7.28711 7.61523 7.28711ZM7.61523 5.30469C6.69922 5.30469 5.94727 4.55273 5.94727 3.63672C5.94727 2.7207 6.69922 1.96875 7.61523 1.96875C8.54492 1.96875 9.29688 2.7207 9.29688 3.63672C9.29688 4.55273 8.54492 5.30469 7.61523 5.30469ZM15.5996 7.28711C17.6094 7.28711 19.2363 5.64648 19.2363 3.63672C19.2363 1.62695 17.6094 0 15.5996 0C13.5898 0 11.9492 1.62695 11.9492 3.63672C11.9492 5.64648 13.5898 7.28711 15.5996 7.28711ZM15.5996 5.30469C14.6836 5.30469 13.9316 4.55273 13.9316 3.63672C13.9316 2.7207 14.6836 1.96875 15.5996 1.96875C16.5156 1.96875 17.2676 2.7207 17.2676 3.63672C17.2676 4.55273 16.5156 5.30469 15.5996 5.30469ZM3.65039 14.4102C5.66016 14.4102 7.28711 12.7695 7.28711 10.7598C7.28711 8.75 5.66016 7.10938 3.65039 7.10938C1.62695 7.10938 0 8.75 0 10.7598C0 12.7695 1.62695 14.4102 3.65039 14.4102ZM3.65039 12.4277C2.7207 12.4277 1.96875 11.6758 1.96875 10.7598C1.96875 9.84375 2.7207 9.0918 3.65039 9.0918C4.56641 9.0918 5.31836 9.84375 5.31836 10.7598C5.31836 11.6758 4.56641 12.4277 3.65039 12.4277ZM19.5781 14.4102C21.5879 14.4102 23.2148 12.7695 23.2148 10.7598C23.2148 8.75 21.5879 7.10938 19.5781 7.10938C17.5684 7.10938 15.9277 8.75 15.9277 10.7598C15.9277 12.7695 17.5684 14.4102 19.5781 14.4102ZM19.5781 12.4277C18.6484 12.4277 17.8965 11.6758 17.8965 10.7598C17.8965 9.84375 18.6484 9.0918 19.5781 9.0918C20.4941 9.0918 21.2461 9.84375 21.2461 10.7598C21.2461 11.6758 20.4941 12.4277 19.5781 12.4277ZM7.61523 21.5332C9.63867 21.5332 11.2656 19.9062 11.2656 17.8965C11.2656 15.8867 9.63867 14.2461 7.61523 14.2461C5.60547 14.2461 3.97852 15.8867 3.97852 17.8965C3.97852 19.9062 5.60547 21.5332 7.61523 21.5332ZM7.61523 19.5645C6.69922 19.5645 5.94727 18.8125 5.94727 17.8965C5.94727 16.9805 6.69922 16.2285 7.61523 16.2285C8.54492 16.2285 9.29688 16.9805 9.29688 17.8965C9.29688 18.8125 8.54492 19.5645 7.61523 19.5645ZM15.5996 21.5332C17.6094 21.5332 19.2363 19.9062 19.2363 17.8965C19.2363 15.8867 17.6094 14.2461 15.5996 14.2461C13.5898 14.2461 11.9492 15.8867 11.9492 17.8965C11.9492 19.9062 13.5898 21.5332 15.5996 21.5332ZM15.5996 19.5645C14.6836 19.5645 13.9316 18.8125 13.9316 17.8965C13.9316 16.9805 14.6836 16.2285 15.5996 16.2285C16.5156 16.2285 17.2676 16.9805 17.2676 17.8965C17.2676 18.8125 16.5156 19.5645 15.5996 19.5645Z"/>
              </svg>
              <span className="text-xl font-bold text-black">Loop</span>
            </div>
          </div>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center pt-20">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-2 border-black border-t-transparent"></div>
          <h2 className="text-lg font-medium text-black">Setting up your calendar access…</h2>
          <p className="mt-2 text-sm text-gray-600">Hang tight for a moment.</p>
        </div>
      </div>
    );
  }

  const headline = hasFailure
    ? 'We hit a snag — ready when you are'
    : '';

  const supportingLine = hasFailure
    ? 'Fix the step below or rerun the flow. Everything else will pick up automatically.'
    : '';

  const primaryButtonLabel = hasFailure ? (isRunning ? 'Retrying…' : 'Retry Pipeline') : isRunning ? 'Working…' : 'Restart';

  const primaryButtonDisabled = isRunning && !hasFailure;

  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-20 backdrop-blur-md bg-white/80 border-b border-black/10">
        <div className="px-6 py-4">
          <div className="flex items-center space-x-2">
            <svg className="w-6 h-6" viewBox="0 0 23.5703 21.5332" fill="black">
              <path d="M7.61523 7.28711C9.63867 7.28711 11.2656 5.64648 11.2656 3.63672C11.2656 1.62695 9.63867 0 7.61523 0C5.60547 0 3.97852 1.62695 3.97852 3.63672C3.97852 5.64648 5.60547 7.28711 7.61523 7.28711ZM7.61523 5.30469C6.69922 5.30469 5.94727 4.55273 5.94727 3.63672C5.94727 2.7207 6.69922 1.96875 7.61523 1.96875C8.54492 1.96875 9.29688 2.7207 9.29688 3.63672C9.29688 4.55273 8.54492 5.30469 7.61523 5.30469ZM15.5996 7.28711C17.6094 7.28711 19.2363 5.64648 19.2363 3.63672C19.2363 1.62695 17.6094 0 15.5996 0C13.5898 0 11.9492 1.62695 11.9492 3.63672C11.9492 5.64648 13.5898 7.28711 15.5996 7.28711ZM15.5996 5.30469C14.6836 5.30469 13.9316 4.55273 13.9316 3.63672C13.9316 2.7207 14.6836 1.96875 15.5996 1.96875C16.5156 1.96875 17.2676 2.7207 17.2676 3.63672C17.2676 4.55273 16.5156 5.30469 15.5996 5.30469ZM3.65039 14.4102C5.66016 14.4102 7.28711 12.7695 7.28711 10.7598C7.28711 8.75 5.66016 7.10938 3.65039 7.10938C1.62695 7.10938 0 8.75 0 10.7598C0 12.7695 1.62695 14.4102 3.65039 14.4102ZM3.65039 12.4277C2.7207 12.4277 1.96875 11.6758 1.96875 10.7598C1.96875 9.84375 2.7207 9.0918 3.65039 9.0918C4.56641 9.0918 5.31836 9.84375 5.31836 10.7598C5.31836 11.6758 4.56641 12.4277 3.65039 12.4277ZM19.5781 14.4102C21.5879 14.4102 23.2148 12.7695 23.2148 10.7598C23.2148 8.75 21.5879 7.10938 19.5781 7.10938C17.5684 7.10938 15.9277 8.75 15.9277 10.7598C15.9277 12.7695 17.5684 14.4102 19.5781 14.4102ZM19.5781 12.4277C18.6484 12.4277 17.8965 11.6758 17.8965 10.7598C17.8965 9.84375 18.6484 9.0918 19.5781 9.0918C20.4941 9.0918 21.2461 9.84375 21.2461 10.7598C21.2461 11.6758 20.4941 12.4277 19.5781 12.4277ZM7.61523 21.5332C9.63867 21.5332 11.2656 19.9062 11.2656 17.8965C11.2656 15.8867 9.63867 14.2461 7.61523 14.2461C5.60547 14.2461 3.97852 15.8867 3.97852 17.8965C3.97852 19.9062 5.60547 21.5332 7.61523 21.5332ZM7.61523 19.5645C6.69922 19.5645 5.94727 18.8125 5.94727 17.8965C5.94727 16.9805 6.69922 16.2285 7.61523 16.2285C8.54492 16.2285 9.29688 16.9805 9.29688 17.8965C9.29688 18.8125 8.54492 19.5645 7.61523 19.5645ZM15.5996 21.5332C17.6094 21.5332 19.2363 19.9062 19.2363 17.8965C19.2363 15.8867 17.6094 14.2461 15.5996 14.2461C13.5898 14.2461 11.9492 15.8867 11.9492 17.8965C11.9492 19.9062 13.5898 21.5332 15.5996 21.5332ZM15.5996 19.5645C14.6836 19.5645 13.9316 18.8125 13.9316 17.8965C13.9316 16.9805 14.6836 16.2285 15.5996 16.2285C16.5156 16.2285 17.2676 16.9805 17.2676 17.8965C17.2676 18.8125 16.5156 19.5645 15.5996 19.5645Z"/>
            </svg>
            <span className="text-xl font-bold text-black">Loop</span>
          </div>
        </div>
      </header>

      <style jsx>{`
        @keyframes gradientShift {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        
        @keyframes fadeInText {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes pulseOpacity {
          0% {
            opacity: 0.6;
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 0.6;
          }
        }
        
        .gradient-text {
          color: #ffffff !important;
          animation: pulseOpacity 1.5s ease-in-out infinite;
        }
        
        .gradient-text p {
          color: #ffffff !important;
        }
      `}</style>

      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-8 pt-20">
        <div className="mx-auto w-full max-w-2xl">
          {headline && (
            <div className="mb-6 space-y-2">
              <h1 className="text-2xl font-semibold text-black">{headline}</h1>
              {supportingLine && <p className="text-sm text-gray-600">{supportingLine}</p>}
            </div>
          )}

          {pipelineError ? (
            <div className="mb-6 rounded-lg border border-red-500 bg-red-50 px-4 py-3 text-sm text-red-600">
              {pipelineError}
            </div>
          ) : null}

          <ul className="space-y-3">
            {steps.map((step) => {
              const isActive = step.status === 'active';
              const isComplete = step.status === 'complete';
              const isError = step.status === 'error';

              const cardClass = [
                'flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors duration-300',
                isActive ? 'border-black bg-black text-white shadow-[0_8px_0_0_rgba(0,0,0,0.08)]' : '',
                isComplete && !isActive ? 'border-black bg-white text-black' : '',
                !isActive && !isComplete && !isError ? 'border-dashed border-gray-300 bg-gray-50 text-gray-600' : '',
                isError ? 'border-red-500 bg-red-50 text-red-600' : '',
              ]
                .filter(Boolean)
                .join(' ');

              const isExpanded = expandedSteps.has(step.id);
              const hasContent = (step.id === 'calendar' && calendarPayload) ||
                               (step.id === 'persona' && persona) ||
                               (step.id === 'digest' && digestResult) ||
                               (step.id === 'audio' && audioDataUrl) ||
                               (step.id === 'event' && calendarEvent);

              return (
                <li key={step.id}>
                  <div className="w-full">
                    <div 
                      className={`${cardClass} ${hasContent ? 'cursor-pointer hover:opacity-80' : ''}`}
                      onClick={hasContent ? () => toggleStepExpansion(step.id) : undefined}
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold uppercase tracking-wide">
                            {step.title}
                          </p>
                          {hasContent && (
                            <span className="text-xs opacity-60">
                              {isExpanded ? '▼' : '▶'}
                            </span>
                          )}
                        </div>
                        <AnimatedText
                          text={isActive ? STEP_DESCRIPTIONS[step.id][activeStepDescriptions[step.id]] : step.description}
                          isActive={isActive}
                          className={`text-sm ${isError ? 'text-red-600' : 'text-gray-600'}`}
                        />
                        {step.error ? (
                          <p className="text-sm font-medium text-red-600">{step.error}</p>
                        ) : null}
                      </div>
                      <StepStatusIcon status={step.status} />
                    </div>
                    
                    {isExpanded && hasContent && (
                      <div className="mt-2 animate-in slide-in-from-top-2 duration-200 w-full">
                        {renderStepContent(step.id)}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-6">
            {hasFailure ? (
              <button
                type="button"
                onClick={runPipeline}
                className="minimal-button"
              >
                Retry Pipeline
              </button>
            ) : pipelineComplete ? (
              <a
                href="https://calendar.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="minimal-button flex items-center justify-center gap-2"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Open Calendar
              </a>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
}

function StepStatusIcon({ status }: { status: StepStatus }) {
  switch (status) {
    case 'complete':
      return (
        <span className="flex h-6 w-6 items-center justify-center rounded-full border border-black bg-black text-xs font-semibold text-white">
          ✓
        </span>
      );
    case 'active':
      return (
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
      );
    case 'error':
      return (
        <span className="flex h-6 w-6 items-center justify-center rounded-full border border-red-500 text-xs font-semibold text-red-500">
          !
        </span>
      );
    default:
      return <span className="h-6 w-6 rounded-full border border-dashed border-gray-300"></span>;
  }
}
