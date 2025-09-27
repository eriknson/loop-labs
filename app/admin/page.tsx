'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/Logo';

interface AdminStats {
  totalUsers: number;
  totalDigests: number;
  totalPersonas: number;
  lastUpdated: string;
  recentActivity: Array<{
    id: string;
    type: 'user_signup' | 'digest_generated' | 'persona_created' | 'calendar_invite_created';
    timestamp: string;
    description: string;
    userId?: string;
  }>;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalDigests: 0,
    totalPersonas: 0,
    lastUpdated: new Date().toISOString(),
    recentActivity: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading admin stats
    const loadStats = async () => {
      setIsLoading(true);
      
      // In a real app, this would fetch from your database
      setTimeout(() => {
        setStats({
          totalUsers: 42,
          totalDigests: 156,
          totalPersonas: 42,
          lastUpdated: new Date().toISOString(),
          recentActivity: [
            {
              id: '1',
              type: 'user_signup',
              timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
              description: 'New user signed up',
              userId: 'user_123'
            },
            {
              id: '2',
              type: 'digest_generated',
              timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
              description: 'Weekly digest generated for user',
              userId: 'user_456'
            },
            {
              id: '3',
              type: 'calendar_invite_created',
              timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
              description: 'Calendar invite created for Sunday digest',
              userId: 'user_789'
            },
            {
              id: '4',
              type: 'persona_created',
              timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
              description: 'Persona profile generated',
              userId: 'user_101'
            }
          ]
        });
        setIsLoading(false);
      }, 1000);
    };

    loadStats();
  }, []);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_signup': return '👤';
      case 'digest_generated': return '📝';
      case 'persona_created': return '🧠';
      case 'calendar_invite_created': return '📅';
      default: return '📊';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Logo />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-gray-600">Loop Labs - System Monitoring</p>
              </div>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => router.push('/')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                View App
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                User Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Digests Generated</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalDigests}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Personas Created</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalPersonas}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            <p className="text-sm text-gray-600">Latest system activity and user interactions</p>
          </div>
          <div className="divide-y divide-gray-200">
            {stats.recentActivity.map((activity) => (
              <div key={activity.id} className="px-6 py-4 flex items-center space-x-4">
                <div className="text-2xl">{getActivityIcon(activity.type)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                  <p className="text-sm text-gray-500">
                    {formatTimestamp(activity.timestamp)}
                    {activity.userId && ` • User: ${activity.userId}`}
                  </p>
                </div>
                <div className="text-sm text-gray-400">
                  {activity.type.replace('_', ' ').toUpperCase()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Status */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Google Calendar API</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Online
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">OpenAI API</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Online
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Database</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Online
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Audio Generation</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Online
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                View All Users
              </button>
              <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                Export Analytics
              </button>
              <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                System Logs
              </button>
              <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                API Status
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Last updated: {formatTimestamp(stats.lastUpdated)}</p>
          <p className="mt-1">Loop Labs Admin Dashboard v1.0</p>
        </div>
      </div>
    </div>
  );
}
