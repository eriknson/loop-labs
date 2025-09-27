'use client';

import { PersonaProfile } from '@/types/persona';

interface PersonaDisplayProps {
  persona: PersonaProfile | null;
}

export default function PersonaDisplay({ persona }: PersonaDisplayProps) {
  // Handle null persona
  if (!persona) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-gray-600">AI</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-600 mb-2">Your Persona</h2>
          <p className="text-gray-500">Persona generation is still in progress...</p>
        </div>
      </div>
    );
  }

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'text-white bg-gray-900';
    if (score >= 0.6) return 'text-white bg-gray-600';
    return 'text-white bg-gray-400';
  };

  const getConfidenceLabel = (score: number) => {
    if (score >= 0.8) return 'High';
    if (score >= 0.6) return 'Medium';
    return 'Low';
  };

  // Extract profile data from the persona structure
  const profile = persona.profile || {};
  const dataHealth = persona.data_health || {};

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Your Persona</h2>
        {dataHealth.confidence_overall && (
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getConfidenceColor(dataHealth.confidence_overall)}`}>
            {getConfidenceLabel(dataHealth.confidence_overall)} Confidence
          </div>
        )}
      </div>

      {/* Persona Summary */}
      {persona.persona_summary_120 && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-gray-700 leading-relaxed">{persona.persona_summary_120}</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Professional Life */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <span className="w-6 h-6 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
              <span className="text-gray-600 text-sm font-bold">P</span>
            </span>
            Professional Life
          </h3>
          <div className="space-y-2 text-sm">
            <p><span className="font-medium">Role Type:</span> {profile.role_type || 'Not specified'}</p>
            <p><span className="font-medium">Field:</span> {profile.field || 'Not specified'}</p>
            <p><span className="font-medium">Location:</span> {profile.home_base?.city && profile.home_base?.country ? `${profile.home_base.city}, ${profile.home_base.country}` : 'Not specified'}</p>
            <p><span className="font-medium">Timezone:</span> {profile.primary_timezone || 'Not specified'}</p>
          </div>
        </div>

        {/* Schedule Patterns */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <span className="w-6 h-6 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
              <span className="text-gray-600 text-sm font-bold">S</span>
            </span>
            Schedule Patterns
          </h3>
          <div className="space-y-2 text-sm">
            <p><span className="font-medium">Day Start:</span> {profile.typical_day_start_local || 'Not specified'}</p>
            <p><span className="font-medium">Day End:</span> {profile.typical_day_end_local || 'Not specified'}</p>
            <p><span className="font-medium">Quiet Hours:</span> {profile.quiet_hours || 'Not specified'}</p>
            {profile.recurring_free_windows?.length > 0 && (
              <div>
                <span className="font-medium">Free Windows:</span>
                <div className="mt-1 space-y-1">
                  {profile.recurring_free_windows.map((window, index) => (
                    <div key={index} className="text-xs text-gray-600">
                      {window.weekday} {window.start}-{window.end}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Interests & Hobbies */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <span className="w-6 h-6 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
              <span className="text-gray-600 text-sm font-bold">I</span>
            </span>
            Interests & Hobbies
          </h3>
          <div className="space-y-2 text-sm">
            {profile.interests_tags?.length > 0 && (
              <div>
                <span className="font-medium">Interests:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {profile.interests_tags.map((tag, index) => (
                    <span key={index} className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {profile.local_event_interests?.length > 0 && (
              <div>
                <span className="font-medium">Event Interests:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {profile.local_event_interests.map((interest, index) => (
                    <span key={index} className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Social Patterns */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <span className="w-6 h-6 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
              <span className="text-gray-600 text-sm font-bold">C</span>
            </span>
            Social Patterns
          </h3>
          <div className="space-y-2 text-sm">
            {profile.recurring_collaborators?.length > 0 && (
              <div>
                <span className="font-medium">Collaborators:</span>
                <div className="mt-1 space-y-1">
                  {profile.recurring_collaborators.map((collaborator, index) => (
                    <div key={index} className="text-xs text-gray-600">
                      {collaborator.label} ({collaborator.cadence})
                    </div>
                  ))}
                </div>
              </div>
            )}
            {profile.venues_frequented?.length > 0 && (
              <div>
                <span className="font-medium">Frequent Venues:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {profile.venues_frequented.map((venue, index) => (
                    <span key={index} className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                      {venue}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* News Topics */}
      {profile.news_topics_weighted?.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
            <span className="w-6 h-6 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
              <span className="text-gray-600 text-sm font-bold">N</span>
            </span>
            News Interests
          </h3>
          <div className="flex flex-wrap gap-2">
            {profile.news_topics_weighted.map((topic, index) => (
              <span key={index} className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                {topic.topic} ({Math.round(topic.weight * 100)}%)
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Travel Patterns */}
      {profile.travel_patterns?.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
            <span className="w-6 h-6 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
              <span className="text-gray-600 text-sm font-bold">T</span>
            </span>
            Travel Patterns
          </h3>
          <div className="space-y-2">
            {profile.travel_patterns.map((trip, index) => (
              <div key={index} className="text-sm text-gray-600">
                {trip.city}, {trip.country} ({trip.start} - {trip.end})
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
