'use client';

import React from 'react';

export default function CookiePolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Cookie Policy</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-6">
              <strong>Last updated:</strong> {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. What Are Cookies?</h2>
              <p className="text-gray-700 mb-4">
                Cookies are small text files that are placed on your device when you visit our website. 
                They help us provide you with a better experience by remembering your preferences, 
                analyzing how you use our site, and personalizing content.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. How We Use Cookies</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">2.1 Essential Cookies</h3>
              <p className="text-gray-700 mb-4">
                These cookies are necessary for the website to function properly. They enable basic 
                functions like page navigation, access to secure areas, and user authentication.
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Authentication and session management</li>
                <li>Security and fraud prevention</li>
                <li>Load balancing and performance</li>
                <li>Essential website functionality</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">2.2 Functional Cookies</h3>
              <p className="text-gray-700 mb-4">
                These cookies enhance your experience by remembering your preferences and choices.
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Language and region preferences</li>
                <li>User interface customization</li>
                <li>Form data retention</li>
                <li>Chat history and settings</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">2.3 Analytics Cookies</h3>
              <p className="text-gray-700 mb-4">
                These cookies help us understand how visitors interact with our website by collecting 
                and reporting information anonymously.
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Page views and navigation patterns</li>
                <li>Feature usage and engagement</li>
                <li>Error tracking and performance monitoring</li>
                <li>User journey analysis</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">2.4 Marketing Cookies</h3>
              <p className="text-gray-700 mb-4">
                These cookies are used to track visitors across websites to display relevant and 
                engaging advertisements.
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Ad targeting and personalization</li>
                <li>Social media integration</li>
                <li>Retargeting campaigns</li>
                <li>Conversion tracking</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Third-Party Cookies</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">3.1 Analytics Services</h3>
              <p className="text-gray-700 mb-4">
                We use third-party analytics services to help us understand how our website is used:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li><strong>Google Analytics:</strong> Website traffic and user behavior analysis</li>
                <li><strong>Vercel Analytics:</strong> Performance monitoring and error tracking</li>
                <li><strong>Hotjar:</strong> User experience and heatmap analysis</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">3.2 Payment Services</h3>
              <p className="text-gray-700 mb-4">
                Stripe uses cookies to process payments securely and prevent fraud.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">3.3 Social Media</h3>
              <p className="text-gray-700 mb-4">
                Social media platforms may set cookies when you interact with social features on our site.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Cookie Duration</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">4.1 Session Cookies</h3>
              <p className="text-gray-700 mb-4">
                These cookies are temporary and are deleted when you close your browser. They are used 
                for session management and security.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">4.2 Persistent Cookies</h3>
              <p className="text-gray-700 mb-4">
                These cookies remain on your device for a set period or until you delete them. They 
                remember your preferences and settings.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">4.3 Third-Party Cookie Duration</h3>
              <p className="text-gray-700 mb-4">
                Third-party cookies have their own expiration policies set by the respective services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Managing Your Cookie Preferences</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">5.1 Browser Settings</h3>
              <p className="text-gray-700 mb-4">
                You can control cookies through your browser settings:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Block all cookies</li>
                <li>Allow cookies from specific sites</li>
                <li>Delete existing cookies</li>
                <li>Set cookie expiration</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">5.2 Our Cookie Consent</h3>
              <p className="text-gray-700 mb-4">
                When you first visit our website, you'll see a cookie consent banner that allows you to:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Accept all cookies</li>
                <li>Customize cookie preferences</li>
                <li>Reject non-essential cookies</li>
                <li>Learn more about our cookie policy</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">5.3 Opt-Out Tools</h3>
              <p className="text-gray-700 mb-4">
                You can opt out of certain third-party cookies:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Google Analytics: <a href="https://tools.google.com/dlpage/gaoptout" className="text-blue-600 hover:underline">Google Analytics Opt-out</a></li>
                <li>Facebook: <a href="https://www.facebook.com/settings?tab=ads" className="text-blue-600 hover:underline">Facebook Ad Preferences</a></li>
                <li>Google Ads: <a href="https://adssettings.google.com/" className="text-blue-600 hover:underline">Google Ad Settings</a></li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Impact of Disabling Cookies</h2>
              <p className="text-gray-700 mb-4">
                If you disable cookies, some features of our website may not function properly:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>You may need to log in repeatedly</li>
                <li>Some features may not work as expected</li>
                <li>Personalization may be limited</li>
                <li>Analytics and performance monitoring may be affected</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Updates to This Policy</h2>
              <p className="text-gray-700 mb-4">
                We may update this cookie policy from time to time to reflect changes in our practices 
                or for other operational, legal, or regulatory reasons. We will notify you of any 
                material changes by posting the updated policy on this page.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Contact Us</h2>
              <p className="text-gray-700 mb-4">
                If you have any questions about our use of cookies, please contact us at:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">
                  <strong>Email:</strong> support@mygenio.xyz<br />
                  <strong>Address:</strong> Tauranga, Bay of Plenty, New Zealand<br />
                  <strong>Data Protection Officer:</strong> Fabio Ponzoni
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Cookie Consent Management</h2>
              <p className="text-gray-700 mb-4">
                You can manage your cookie preferences at any time by clicking the "Cookie Settings" 
                link in the footer of our website or by contacting us directly.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
