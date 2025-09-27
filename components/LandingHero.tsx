'use client';

import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useRouter } from 'next/navigation';

export default function LandingHero() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setIsLoading(true);
    try {
      // Send credential to backend for verification and token exchange
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          credential: credentialResponse.credential,
        }),
      });

      if (response.ok) {
        const authData = await response.json();
        // Store user info in localStorage for demo purposes
        if (authData.user?.email) {
          localStorage.setItem('userEmail', authData.user.email);
          localStorage.setItem('userName', authData.user.name);
        }
        // Redirect to dashboard or loading screen
        router.push('/dashboard');
      } else {
        console.error('Authentication failed');
      }
    } catch (error) {
      console.error('Authentication error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    console.error('Google authentication failed');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      {/* Logo */}
      <div className="mb-12">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-xl">L</span>
          </div>
          <span className="text-3xl font-bold text-gray-900">Loop</span>
        </div>
      </div>

      {/* Hero Content */}
      <div className="text-center mb-12 max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Your AI-Powered Weekly Digest
        </h1>
        <p className="text-xl text-gray-600 mb-8 leading-relaxed">
          Connect your Google Calendar and get a personalized weekly digest automatically 
          generated and added to your calendar every Sunday. No manual work required.
        </p>
        
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-blue-50 p-6 rounded-xl">
            <div className="text-3xl mb-3">🔍</div>
            <h3 className="font-semibold text-gray-900 mb-2">Analyze</h3>
            <p className="text-gray-600 text-sm">AI analyzes your calendar patterns and creates your unique persona</p>
          </div>
          <div className="bg-green-50 p-6 rounded-xl">
            <div className="text-3xl mb-3">📝</div>
            <h3 className="font-semibold text-gray-900 mb-2">Generate</h3>
            <p className="text-gray-600 text-sm">Weekly digest with insights, trends, and personalized recommendations</p>
          </div>
          <div className="bg-purple-50 p-6 rounded-xl">
            <div className="text-3xl mb-3">📅</div>
            <h3 className="font-semibold text-gray-900 mb-2">Schedule</h3>
            <p className="text-gray-600 text-sm">Automatically added to your calendar every Sunday at 9 AM</p>
          </div>
        </div>
      </div>

      {/* Google Sign-in Section */}
      <div className="space-y-6 text-center">
        <div className="flex flex-col items-center space-y-4">
<<<<<<< Updated upstream
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            theme="outline"
            size="large"
            text="continue_with"
            shape="pill"
            width="300"
            useOneTap={false}
            auto_select={false}
          />
          
          {isLoading && (
            <div className="flex items-center space-x-2 text-gray-600">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span>Connecting your calendar...</span>
=======
          <button
            onClick={handleGoogleAuth}
            disabled={isLoading}
            className="google-button disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>Start Your Automated Loop</span>
          </button>
          
          {isLoading && (
            <div className="flex items-center space-x-2 text-gray-600">
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              <span>Setting up your automated flow...</span>
>>>>>>> Stashed changes
            </div>
          )}
        </div>
        
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          By connecting your calendar, you agree to our privacy policy. 
          We only access your calendar data to provide personalized insights.
        </p>
      </div>
    </div>
  );
}
