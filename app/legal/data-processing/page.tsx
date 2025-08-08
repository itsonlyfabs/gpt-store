'use client';

import React from 'react';

export default function DataProcessingAgreement() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Data Processing Agreement</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-6">
              <strong>Last updated:</strong> {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
              <p className="text-gray-700 mb-4">
                This Data Processing Agreement ("DPA") forms part of our Terms of Service and Privacy Policy. 
                It outlines how we process your personal data in compliance with applicable data protection laws, 
                including the General Data Protection Regulation (GDPR).
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Definitions</h2>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li><strong>Personal Data:</strong> Any information relating to an identified or identifiable natural person</li>
                <li><strong>Processing:</strong> Any operation performed on personal data</li>
                <li><strong>Data Controller:</strong> The entity determining the purposes and means of processing</li>
                <li><strong>Data Processor:</strong> The entity processing personal data on behalf of the controller</li>
                <li><strong>Data Subject:</strong> The individual whose personal data is being processed</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Roles and Responsibilities</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">3.1 Data Controller</h3>
              <p className="text-gray-700 mb-4">
                Genio acts as the data controller for personal data collected directly from users, including:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Account registration information</li>
                <li>Payment and billing data</li>
                <li>User preferences and settings</li>
                <li>Communication preferences</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">3.2 Data Processor</h3>
              <p className="text-gray-700 mb-4">
                Genio acts as a data processor when processing personal data on behalf of users through our AI services, including:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>AI chat interactions and conversations</li>
                <li>Generated content and responses</li>
                <li>Usage analytics and performance data</li>
                <li>Service improvement data</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Types of Personal Data Processed</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">4.1 Account Data</h3>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Name and email address</li>
                <li>Account credentials and authentication data</li>
                <li>Profile information and preferences</li>
                <li>Subscription and billing information</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">4.2 Usage Data</h3>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Chat conversations and interactions</li>
                <li>AI-generated content and responses</li>
                <li>Feature usage and engagement metrics</li>
                <li>Error logs and performance data</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">4.3 Technical Data</h3>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Device information and identifiers</li>
                <li>IP addresses and location data</li>
                <li>Browser and operating system information</li>
                <li>Network and connection data</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Legal Basis for Processing</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">5.1 Contract Performance</h3>
              <p className="text-gray-700 mb-4">
                Processing necessary for the performance of our service agreement with you.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">5.2 Legitimate Interests</h3>
              <p className="text-gray-700 mb-4">
                Processing for our legitimate business interests, such as service improvement and security.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">5.3 Consent</h3>
              <p className="text-gray-700 mb-4">
                Processing based on your explicit consent for specific purposes.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">5.4 Legal Obligations</h3>
              <p className="text-gray-700 mb-4">
                Processing required to comply with applicable laws and regulations.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Data Processing Purposes</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">6.1 Service Provision</h3>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Account creation and management</li>
                <li>AI service delivery and interaction</li>
                <li>Payment processing and billing</li>
                <li>Customer support and communication</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">6.2 Service Improvement</h3>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>AI model training and optimization</li>
                <li>Feature development and enhancement</li>
                <li>Performance monitoring and optimization</li>
                <li>User experience improvement</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">6.3 Security and Compliance</h3>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Fraud prevention and security monitoring</li>
                <li>Legal compliance and regulatory reporting</li>
                <li>Dispute resolution and enforcement</li>
                <li>Data protection and privacy compliance</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Data Retention</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">7.1 Retention Periods</h3>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li><strong>Account Data:</strong> Retained for the duration of your account plus 30 days</li>
                <li><strong>Chat Interactions:</strong> Retained for 2 years for service improvement</li>
                <li><strong>Payment Data:</strong> Retained for 7 years for legal compliance</li>
                <li><strong>Analytics Data:</strong> Retained for 3 years for business intelligence</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">7.2 Data Deletion</h3>
              <p className="text-gray-700 mb-4">
                Upon account deletion or data subject request, we will delete or anonymize your personal data 
                within 30 days, except where retention is required by law.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Data Security</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">8.1 Security Measures</h3>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Encryption of data in transit and at rest</li>
                <li>Access controls and authentication</li>
                <li>Regular security audits and assessments</li>
                <li>Incident response and breach notification</li>
                <li>Employee training and awareness</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">8.2 Third-Party Security</h3>
              <p className="text-gray-700 mb-4">
                We ensure that all third-party processors implement appropriate security measures 
                and comply with data protection requirements.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Data Subject Rights</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">9.1 Your Rights</h3>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Rectification:</strong> Correct inaccurate or incomplete data</li>
                <li><strong>Erasure:</strong> Request deletion of your personal data</li>
                <li><strong>Portability:</strong> Receive your data in a portable format</li>
                <li><strong>Restriction:</strong> Limit how we process your data</li>
                <li><strong>Objection:</strong> Object to certain types of processing</li>
                <li><strong>Withdrawal:</strong> Withdraw consent at any time</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">9.2 Exercising Your Rights</h3>
              <p className="text-gray-700 mb-4">
                You can exercise your rights by contacting us at support@mygenio.xyz. We will respond 
                to your request within 30 days.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. International Transfers</h2>
              <p className="text-gray-700 mb-4">
                Your data may be transferred to and processed in countries outside your residence. 
                We ensure appropriate safeguards are in place, including:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Standard Contractual Clauses (SCCs)</li>
                <li>Adequacy decisions</li>
                <li>Certification schemes</li>
                <li>Binding corporate rules</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Third-Party Processors</h2>
              <p className="text-gray-700 mb-4">
                We use the following third-party processors who have access to your personal data:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li><strong>OpenAI:</strong> AI service provision and model training</li>
                <li><strong>Anthropic:</strong> AI service provision and model training</li>
                <li><strong>Stripe:</strong> Payment processing and billing</li>
                <li><strong>Supabase:</strong> Database hosting and authentication</li>
                <li><strong>Vercel:</strong> Website hosting and analytics</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Breach Notification</h2>
              <p className="text-gray-700 mb-4">
                In the event of a personal data breach, we will notify the relevant supervisory authority 
                within 72 hours and affected data subjects without undue delay, as required by law.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Contact Information</h2>
              <p className="text-gray-700 mb-4">
                For questions about this DPA or to exercise your data protection rights, contact us at:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">
                  <strong>Email:</strong> support@mygenio.xyz<br />
                  <strong>Data Protection Officer:</strong> Fabio Ponzoni<br />
                  <strong>Address:</strong> Tauranga, Bay of Plenty, New Zealand<br />
                  <strong>Supervisory Authority:</strong> Office of the Privacy Commissioner (New Zealand)
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Changes to This Agreement</h2>
              <p className="text-gray-700 mb-4">
                We may update this DPA from time to time to reflect changes in our data processing 
                practices or legal requirements. We will notify you of material changes via email 
                or through our service.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
