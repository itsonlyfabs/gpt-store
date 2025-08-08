'use client';

import React from 'react';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-6">
              <strong>Last updated:</strong> {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 mb-4">
                By accessing and using Genio ("the Service"), you accept and agree to be bound by the terms 
                and provision of this agreement. If you do not agree to abide by the above, please do not 
                use this service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
              <p className="text-gray-700 mb-4">
                Genio is a platform that provides access to AI-powered tools and services for mental fitness, 
                personal development, and productivity enhancement. Our services include:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>AI chat interfaces and conversational tools</li>
                <li>Prompt templates and AI assistance</li>
                <li>Specialized APIs for mental wellness</li>
                <li>Subscription-based access to premium features</li>
                <li>One-time purchases of specific tools</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Accounts</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">3.1 Account Creation</h3>
              <p className="text-gray-700 mb-4">
                To access certain features of the Service, you must create an account. You agree to provide 
                accurate, current, and complete information during registration and to update such information 
                to keep it accurate, current, and complete.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">3.2 Account Security</h3>
              <p className="text-gray-700 mb-4">
                You are responsible for safeguarding the password and for all activities that occur under 
                your account. You agree to notify us immediately of any unauthorized use of your account.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">3.3 Age Requirements</h3>
              <p className="text-gray-700 mb-4">
                You must be at least 13 years old to use the Service. If you are under 18, you must have 
                parental or guardian consent to use the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Payment Terms</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">4.1 Pricing</h3>
              <p className="text-gray-700 mb-4">
                All prices are displayed in your local currency and include applicable taxes. We reserve 
                the right to change prices at any time with 30 days' notice to existing subscribers.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">4.2 Billing</h3>
              <p className="text-gray-700 mb-4">
                Subscriptions are billed in advance on a recurring basis. You authorize us to charge your 
                payment method for all fees incurred.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">4.3 Refunds</h3>
              <p className="text-gray-700 mb-4">
                Refunds are provided at our discretion and in accordance with our refund policy. 
                Contact our support team for refund requests.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Acceptable Use</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">5.1 Prohibited Activities</h3>
              <p className="text-gray-700 mb-4">You agree not to:</p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Use the Service for any illegal or unauthorized purpose</li>
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe upon the rights of others</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Interfere with or disrupt the Service</li>
                <li>Use the Service to generate harmful, offensive, or inappropriate content</li>
                <li>Share your account credentials with others</li>
                <li>Reverse engineer or attempt to extract source code</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">5.2 Content Guidelines</h3>
              <p className="text-gray-700 mb-4">
                You are responsible for all content you generate using our AI tools. Content must not be 
                harmful, offensive, discriminatory, or violate any applicable laws.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Intellectual Property</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">6.1 Our Rights</h3>
              <p className="text-gray-700 mb-4">
                The Service and its original content, features, and functionality are owned by Genio and 
                are protected by international copyright, trademark, patent, trade secret, and other 
                intellectual property laws.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">6.2 Your Rights</h3>
              <p className="text-gray-700 mb-4">
                You retain ownership of content you create using our AI tools, subject to these terms 
                and any applicable third-party licenses.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">6.3 License</h3>
              <p className="text-gray-700 mb-4">
                We grant you a limited, non-exclusive, non-transferable license to use the Service 
                for your personal or business use in accordance with these terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Privacy and Data</h2>
              <p className="text-gray-700 mb-4">
                Your privacy is important to us. Please review our Privacy Policy, which also governs 
                your use of the Service, to understand our practices regarding the collection and use 
                of your information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Disclaimers</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">8.1 Service Availability</h3>
              <p className="text-gray-700 mb-4">
                The Service is provided "as is" and "as available" without warranties of any kind. 
                We do not guarantee uninterrupted or error-free operation.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">8.2 AI Content</h3>
              <p className="text-gray-700 mb-4">
                AI-generated content may not always be accurate, complete, or appropriate. You should 
                review and verify all AI-generated content before relying on it.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">8.3 Third-Party Services</h3>
              <p className="text-gray-700 mb-4">
                We use third-party services (OpenAI, Anthropic, Stripe) that have their own terms 
                and privacy policies. We are not responsible for their services or policies.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Limitation of Liability</h2>
              <p className="text-gray-700 mb-4">
                In no event shall Genio, its directors, employees, partners, agents, suppliers, or 
                affiliates be liable for any indirect, incidental, special, consequential, or punitive 
                damages, including without limitation, loss of profits, data, use, goodwill, or other 
                intangible losses, resulting from your use of the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Indemnification</h2>
              <p className="text-gray-700 mb-4">
                You agree to defend, indemnify, and hold harmless Genio and its affiliates from and 
                against any claims, damages, obligations, losses, liabilities, costs, or debt arising 
                from your use of the Service or violation of these terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Termination</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">11.1 Termination by You</h3>
              <p className="text-gray-700 mb-4">
                You may terminate your account at any time by contacting our support team or using 
                the account deletion feature in your settings.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">11.2 Termination by Us</h3>
              <p className="text-gray-700 mb-4">
                We may terminate or suspend your account immediately, without prior notice, for conduct 
                that we believe violates these terms or is harmful to other users or the Service.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">11.3 Effect of Termination</h3>
              <p className="text-gray-700 mb-4">
                Upon termination, your right to use the Service will cease immediately. We may delete 
                your account and data in accordance with our data retention policies.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Governing Law</h2>
              <p className="text-gray-700 mb-4">
                These terms shall be governed by and construed in accordance with the laws of 
                New Zealand, without regard to its conflict of law provisions.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Dispute Resolution</h2>
              <p className="text-gray-700 mb-4">
                Any disputes arising from these terms or your use of the Service shall be resolved 
                through binding arbitration in accordance with the rules of the New Zealand Disputes 
                Tribunal or, for international disputes, the New Zealand International Arbitration 
                Centre (NZIAC).
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Changes to Terms</h2>
              <p className="text-gray-700 mb-4">
                We reserve the right to modify these terms at any time. We will notify users of 
                material changes via email or through the Service. Your continued use of the Service 
                after such changes constitutes acceptance of the new terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">15. Contact Information</h2>
              <p className="text-gray-700 mb-4">
                If you have any questions about these terms, please contact us at:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">
                  <strong>Email:</strong> support@mygenio.xyz<br />
                  <strong>Address:</strong> Tauranga, Bay of Plenty, New Zealand<br />
                  <strong>Support:</strong> support@mygenio.xyz
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
