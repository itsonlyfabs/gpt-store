# Project Requirements Document (PRD)

## 1. Project Overview

**Paragraph 1:**\
This project is a personal GPT Store—modeled after the official OpenAI GPT Store—where users can discover, purchase, and access custom AI tools focused on mental fitness, mindset coaching, and personal development. The store will offer bespoke chatbots, prompt templates, and specialized APIs designed to help individuals and business professionals overcome mental obstacles, eliminate limiting beliefs, and enhance clarity, focus, and energy. All GPT logic runs on your server using a centralized OpenAI API key, so customers enjoy a seamless experience without managing their own credentials.

**Paragraph 2:**\
We’re building this store to provide a one-stop-shop for high-quality, AI-powered mental fitness solutions and to monetize your proprietary GPT products. Key objectives include: (1) delivering a smooth, modern browsing and purchasing experience, (2) supporting flexible pricing models (one-time purchases, subscriptions, pay-as-you-go), (3) securing transactions via Stripe with multi-currency support, and (4) enabling robust admin tools for sales tracking, user management, and analytics. Success will be measured by a working MVP, satisfied early adopters, stable payment flows, and clear usage metrics.

## 2. In-Scope vs. Out-of-Scope

**In-Scope (Version 1):**

*   User sign-up, email verification, login, password recovery
*   Product catalog with search, categories (e.g., Limiting Beliefs, Clarity, Focus, Energy, Values, Identity Shift) and filters (price, popularity, new arrivals)
*   Product detail pages showing descriptions, pricing options, sample interactions, reviews
*   Stripe integration for one-time, monthly/annual subscriptions, pay-as-you-go credits; multi-currency pricing; VAT calculations
*   User portal listing owned/subscribed GPTs, “Open Chat” interface, prompt template downloads, API key retrieval, live usage metrics
*   Admin dashboard: sales overview, user management, refund processing, analytics (engagement, revenue, churn)
*   Hosting of all GPT logic on your server via OpenAI GPT-4 o1 and Anthropic Claude 3.5 Sonnet
*   Email notifications: account verification, purchase receipts, renewal reminders
*   Basic legal pages: Terms of Service, Privacy Policy

**Out-of-Scope (Phase 2+):**

*   Guest checkout (no account)
*   Third-party seller onboarding / marketplace features
*   Mobile-only or native mobile apps
*   Multi-language localization
*   Advanced marketing automation / A/B testing
*   Affiliate/referral program
*   Offline access or desktop clients

## 3. User Flow

**Paragraph 1:**\
A new user arrives on the minimalist homepage, greeted by a search bar and a horizontal carousel of categories (Limiting Beliefs, Clarity, Focus, etc.). The top navigation bar features links to “Browse All,” “My Account,” and “Help.” To explore or buy, the visitor clicks “Sign Up,” enters name, email, and a secure password, then confirms via email link. Once authenticated, the user lands on their personalized “Discover” page.

**Paragraph 2:**\
On “Discover,” the user sees GPT products sorted by popularity, new arrivals, and staff picks. They refine results with filters (price, rating, subscription type) or keywords. Clicking a product opens its detail page where they choose between one-time purchase, subscription, or credits. Hitting “Buy” triggers a Stripe checkout modal with VAT breakdown. After successful payment, the portal unlocks the GPT: users launch the chat interface, download templates, or fetch API keys. They track usage, leave reviews, or manage subscriptions in their dashboard.

## 4. Core Features

*   **User Authentication & Authorization**\
    • Sign-up, email verification, login/logout, password reset\
    • JSON Web Tokens (JWT) for session management
*   **Product Catalog & Discovery**\
    • Search by keyword\
    • Categories carousel (Limiting Beliefs, Clarity, etc.)\
    • Filters: price range, subscription type, rating
*   **Product Detail & Customization**\
    • Descriptions, sample interactions, customer reviews\
    • Pricing options: one-time, monthly, annual, pay-as-you-go\
    • Real-time update of “Buy” button based on selection
*   **Checkout & Billing**\
    • Stripe integration with multi-currency support\
    • VAT handling per regional rules\
    • Credit-to-usage conversion display
*   **User Portal & Access Control**\
    • List of owned/subscribed GPTs\
    • “Open Chat” interface (hosted on your server)\
    • Downloadable prompt templates\
    • API key retrieval for specialized APIs\
    • Live usage metrics (credits left, session history)
*   **Admin Dashboard**\
    • Sales analytics and revenue charts\
    • User management (view, edit, revoke access)\
    • Refund processing workflow\
    • KPI tracking (active subscriptions, churn, new users)
*   **AI Hosting & Integration**\
    • Server-side calls to OpenAI GPT-4 o1 and Anthropic Claude 3.5\
    • Rate limiting, error handling, retry logic\
    • Centralized API key management
*   **Notifications & Emails**\
    • Account verification, purchase receipts, renewal alerts\
    • Templates stored in AWS S3 or similar
*   **Compliance & Legal**\
    • Terms of Service, Privacy Policy pages\
    • VAT calculation and tax reporting support

## 5. Tech Stack & Tools

*   **Frontend:**\
    • React (UI library)\
    • Next.js (server-side rendering, routing)\
    • V0 by Vercel (AI-powered component builder)\
    • Tailwind CSS or styled-components for styling
*   **Backend:**\
    • Node.js with Express (REST API server)\
    • PostgreSQL (relational database)\
    • AWS S3 (asset storage: images, templates)\
    • JWT (authentication tokens)
*   **Payments & Billing:**\
    • Stripe Node SDK (secure checkout, subscriptions, multi-currency)
*   **AI Integration:**\
    • OpenAI API (GPT-4 O1)\
    • Anthropic Claude 3.5 Sonnet API
*   **Development & IDE:**\
    • Cursor (AI-powered coding assistant)\
    • GitHub (version control)
*   **Monitoring & Logging:**\
    • AWS CloudWatch or Datadog\
    • Sentry (error tracking)

## 6. Non-Functional Requirements

*   **Performance:**\
    • Page load ≤ 2 seconds on 3G/4G\
    • Chat response ≤ 1 second average
*   **Scalability & Reliability:**\
    • Auto-scaling backend on AWS\
    • 99.9% uptime SLA
*   **Security:**\
    • All traffic over HTTPS (TLS 1.2+)\
    • OWASP Top 10 defense (XSS, CSRF protection)\
    • Stripe PCI DSS compliance for payments\
    • Encryption at rest (database) and in transit
*   **Compliance & Privacy:**\
    • GDPR-compliant data handling\
    • Clear TOS and Privacy Policy\
    • VAT collection and remittance support
*   **Usability & Accessibility:**\
    • Mobile-responsive design\
    • WCAG 2.1 AA accessibility standards

## 7. Constraints & Assumptions

*   **OpenAI API Limits:**\
    • Subject to rate limits and usage quotas; plan caching or batching
*   **Stripe Multi-Currency:**\
    • Assume Stripe supports all target currencies without custom FX
*   **Hosting Environment:**\
    • AWS infrastructure for backend, storage, monitoring
*   **User Base:**\
    • Initial launch targets small to mid-sized user volume (< 1,000 active users)
*   **Design Guidelines:**\
    • Default to a minimalist, neutral palette (white, gray, blue) and sans-serif fonts unless branding assets provided
*   **Legal Review:**\
    • User will secure legal counsel for final TOS, Privacy, and tax requirements

## 8. Known Issues & Potential Pitfalls

*   **API Rate Limits & Costs:**\
    • High chat traffic may hit OpenAI limits—mitigate with request batching, caching, or token quotas
*   **VAT Complexity:**\
    • Handling VAT across multiple countries can be error-prone; consider integrating a tax-compliance service (e.g., TaxJar)
*   **Stripe Webhooks:**\
    • Ensure idempotent webhook handlers to avoid duplicate events
*   **Scaling Real-Time Chat:**\
    • Might require WebSockets or long polling as user count grows
*   **Currency Rounding Errors:**\
    • Define consistent rounding rules (e.g., 2 decimal places) and surface them in UI
*   **Security of JWTs:**\
    • Plan token revocation lists or short-lived tokens with refresh mechanism
*   **CORS & Next.js Routing:**\
    • Configure CORS policies correctly for API routes in Next.js
*   **Data Privacy:**\
    • Mask or omit sensitive user data in logs; use environment variables for secrets

*This PRD is the single source of truth. All subsequent technical documents—Tech Stack Details, Frontend Guidelines, Backend Structure, App Flowcharts, Security Standards, and Implementation Plans—should align fully with the specifications above.*
