'use client';

import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-6">
              <strong>Last updated:</strong> {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Information We Collect</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">1.1 Personal Information</h3>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Name and email address (for account creation)</li>
                <li>Payment information (processed securely by Stripe)</li>
                <li>Usage data and chat interactions with AI tools</li>
                <li>Device information and IP addresses</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">1.2 AI Interaction Data</h3>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Chat conversations and prompts sent to AI services</li>
                <li>AI responses and generated content</li>
                <li>Usage patterns and preferences</li>
                <li>Product interaction history</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. How We Use Your Information</h2>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Provide and maintain our AI tools and services</li>
                <li>Process payments and manage subscriptions</li>
                <li>Improve our AI models and user experience</li>
                <li>Send important service updates and notifications</li>
                <li>Comply with legal obligations</li>
                <li>Prevent fraud and ensure security</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Data Sharing and Third Parties</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">3.1 AI Service Providers</h3>
              <p className="text-gray-700 mb-4">
                We share your chat interactions with OpenAI and Anthropic to provide AI services. 
                These providers have their own privacy policies and data handling practices.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">3.2 Payment Processors</h3>
              <p className="text-gray-700 mb-4">
                Payment information is processed by Stripe, which has its own privacy policy 
                and security measures in place.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">3.3 Legal Requirements</h3>
              <p className="text-gray-700 mb-4">
                We may disclose your information if required by law or to protect our rights 
                and safety.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Data Security</h2>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Encryption of data in transit and at rest</li>
                <li>Secure authentication and access controls</li>
                <li>Regular security audits and updates</li>
                <li>Limited access to personal data by authorized personnel only</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Your Rights and Choices</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">5.1 Access and Control</h3>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Access your personal data</li>
                <li>Correct inaccurate information</li>
                <li>Delete your account and associated data</li>
                <li>Export your data in a portable format</li>
                <li>Opt-out of marketing communications</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">5.2 Cookie Preferences</h3>
              <p className="text-gray-700 mb-4">
                You can manage cookie preferences through your browser settings or our 
                cookie consent banner.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Data Retention</h2>
              <p className="text-gray-700 mb-4">
                We retain your personal data for as long as necessary to provide our services, 
                comply with legal obligations, resolve disputes, and enforce agreements. 
                Chat interactions may be retained for service improvement purposes.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. International Data Transfers</h2>
              <p className="text-gray-700 mb-4">
                Your data may be transferred to and processed in countries other than your own. 
                We ensure appropriate safeguards are in place to protect your data in accordance 
                with applicable laws.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Children's Privacy</h2>
              <p className="text-gray-700 mb-4">
                Our services are not intended for children under 13. We do not knowingly collect 
                personal information from children under 13. If you believe we have collected 
                such information, please contact us immediately.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Changes to This Policy</h2>
              <p className="text-gray-700 mb-4">
                We may update this privacy policy from time to time. We will notify you of any 
                material changes by posting the new policy on this page and updating the 
                "Last updated" date.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Contact Us</h2>
              <p className="text-gray-700 mb-4">
                If you have any questions about this privacy policy or our data practices, 
                please contact us at:
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
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. GDPR Compliance (EU Users)</h2>
              <p className="text-gray-700 mb-4">
                If you are located in the European Union, you have additional rights under the 
                General Data Protection Regulation (GDPR), including the right to lodge a 
                complaint with your local data protection authority.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. CCPA Compliance (California Users)</h2>
              <p className="text-gray-700 mb-4">
                California residents have additional rights under the California Consumer 
                Privacy Act (CCPA), including the right to know what personal information 
                we collect and how we use it.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
