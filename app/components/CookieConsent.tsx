'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface CookiePreferences {
  essential: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true, // Always true, cannot be disabled
    functional: false,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      setShowBanner(true);
    } else {
      // Load saved preferences
      try {
        const savedPreferences = JSON.parse(consent);
        setPreferences(savedPreferences);
      } catch (error) {
        console.error('Error parsing saved cookie preferences:', error);
      }
    }
  }, []);

  const acceptAll = () => {
    const allAccepted = {
      essential: true,
      functional: true,
      analytics: true,
      marketing: true,
    };
    setPreferences(allAccepted);
    localStorage.setItem('cookieConsent', JSON.stringify(allAccepted));
    setShowBanner(false);
  };

  const acceptSelected = () => {
    localStorage.setItem('cookieConsent', JSON.stringify(preferences));
    setShowBanner(false);
    setShowSettings(false);
  };

  const rejectAll = () => {
    const onlyEssential = {
      essential: true,
      functional: false,
      analytics: false,
      marketing: false,
    };
    setPreferences(onlyEssential);
    localStorage.setItem('cookieConsent', JSON.stringify(onlyEssential));
    setShowBanner(false);
  };

  const updatePreference = (type: keyof CookiePreferences, value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [type]: value,
    }));
  };

  if (!showBanner) {
    return null;
  }

  return (
    <>
      {/* Main Cookie Banner */}
      {!showSettings && (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4 z-50 shadow-lg">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm">
                We use cookies to enhance your experience, analyze site traffic, and personalize content. 
                By continuing to use our site, you consent to our use of cookies. 
                <Link href="/legal/cookies" className="text-blue-300 hover:text-blue-200 underline ml-1">
                  Learn more
                </Link>
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => setShowSettings(true)}
                className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 rounded transition-colors"
              >
                Customize
              </button>
              <button
                onClick={rejectAll}
                className="px-4 py-2 text-sm bg-gray-600 hover:bg-gray-500 rounded transition-colors"
              >
                Reject All
              </button>
              <button
                onClick={acceptAll}
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 rounded transition-colors"
              >
                Accept All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cookie Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Cookie Settings</h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Essential Cookies */}
                <div className="border-b pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Essential Cookies</h3>
                      <p className="text-sm text-gray-600">
                        Required for the website to function properly. Cannot be disabled.
                      </p>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={preferences.essential}
                        disabled
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <ul className="text-sm text-gray-600 list-disc list-inside">
                    <li>Authentication and session management</li>
                    <li>Security and fraud prevention</li>
                    <li>Essential website functionality</li>
                  </ul>
                </div>

                {/* Functional Cookies */}
                <div className="border-b pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Functional Cookies</h3>
                      <p className="text-sm text-gray-600">
                        Enhance your experience by remembering your preferences.
                      </p>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={preferences.functional}
                        onChange={(e) => updatePreference('functional', e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <ul className="text-sm text-gray-600 list-disc list-inside">
                    <li>Language and region preferences</li>
                    <li>User interface customization</li>
                    <li>Chat history and settings</li>
                  </ul>
                </div>

                {/* Analytics Cookies */}
                <div className="border-b pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Analytics Cookies</h3>
                      <p className="text-sm text-gray-600">
                        Help us understand how visitors interact with our website.
                      </p>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={preferences.analytics}
                        onChange={(e) => updatePreference('analytics', e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <ul className="text-sm text-gray-600 list-disc list-inside">
                    <li>Page views and navigation patterns</li>
                    <li>Feature usage and engagement</li>
                    <li>Performance monitoring</li>
                  </ul>
                </div>

                {/* Marketing Cookies */}
                <div className="border-b pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Marketing Cookies</h3>
                      <p className="text-sm text-gray-600">
                        Used to display relevant advertisements and track conversions.
                      </p>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={preferences.marketing}
                        onChange={(e) => updatePreference('marketing', e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <ul className="text-sm text-gray-600 list-disc list-inside">
                    <li>Ad targeting and personalization</li>
                    <li>Social media integration</li>
                    <li>Retargeting campaigns</li>
                  </ul>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <button
                  onClick={rejectAll}
                  className="flex-1 px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 text-gray-800 rounded transition-colors"
                >
                  Reject All
                </button>
                <button
                  onClick={acceptAll}
                  className="flex-1 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                >
                  Accept All
                </button>
                <button
                  onClick={acceptSelected}
                  className="flex-1 px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                >
                  Save Preferences
                </button>
              </div>

              <div className="mt-4 text-center">
                <Link href="/legal/cookies" className="text-sm text-blue-600 hover:text-blue-800 underline">
                  Learn more about our cookie policy
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
