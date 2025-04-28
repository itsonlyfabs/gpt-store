# Project Rules for Personal GPT Store

## Project Overview

* **Type:** Personal GPT Store
* **Description:** A mental fitness and personal development store allowing users to purchase and access custom AI tools (chatbots, prompt templates, specialized APIs) to enhance mental clarity, focus, and overall well-being.
* **Primary Goal:** Enable business professionals and individuals to seamlessly browse, purchase, and use AI-driven mental wellness tools in a secure, scalable, and user-friendly platform.

## Project Structure

### Framework-Specific Routing

* **Directory Rules:**
  * `Next.js 14 (App Router)`: Use the `app/` directory with nested route folders. Each route has its own folder containing `page.tsx` (and optional `layout.tsx`, `loading.tsx`).
  * _Example 1:_ `app/auth/login/page.tsx` for sign-in
  * _Example 2:_ `app/products/[id]/page.tsx` for product detail
  * _Example 3:_ `app/dashboard/layout.tsx` for user dashboard shell

### Core Directories

* **Versioned Structure:**
  * `app/api`: Next.js 14 API routes with Route Handlers (e.g., `route.ts`)
  * `app/auth`: Authentication flows (`login`, `register`, `forgot-password`)
  * `app/dashboard`: User portal (`purchased`, `usage-metrics`, `chat-interface`)
  * `app/products`: Product catalog and details
  * `app/checkout`: Stripe integration pages
  * `app/admin`: Admin dashboard for sales, refunds, analytics
  * `public`: Static assets (images, logos)

### Key Files

* **Stack-Versioned Patterns:**
  * `app/layout.tsx`: Next.js 14 root layout (defines HTML shell, global providers)
  * `app/page.tsx`: Home page component
  * `app/api/stripe/route.ts`: Stripe webhook and checkout handlers
  * `next.config.js`: Next.js configuration (Image domains, rewrites)
  * `tailwind.config.js` or `styled-components.config.js`: Styling framework setup

## Tech Stack Rules

* **Version Enforcement:**
  * `next@14`: App Router required; **no** `getInitialProps` or `pages/` directory
  * `react@18`: Use hooks and concurrent features
  * `node@18`: ES modules enabled; use `import` syntax
  * `express@4`: Mount under `app/api/legacy` only if needed
  * `postgres@14`: Use Prisma or TypeORM with migrations
  * `aws-sdk@3`: Use modular imports for S3
  * `stripe@10`: Use Stripe Node SDK v10+, multi-currency support
  * `openai@4`: Use typed client with streaming support
  * `@anthropic/sdk@latest`: Claude 3.5 Sonnet integration
  * `cursor@latest`: AI coding assistance in IDE
  * `sentry@7`: Initialize in `app/layout.tsx`, capture client/server errors

## PRD Compliance

* **Non-Negotiable:**
  * "Users must create accounts and log in before browsing and purchasing.": Enforce auth middleware on `/products` and `/checkout` routes using server components and NextAuth JWT guard.
  * "Stripe, with support for multiple currencies.": Configure Stripe Price objects and session creation to handle USD, EUR, GBP, etc.
  * "GDPR compliance, clear TOS and Privacy Policy, VAT support.": Include `/legal/terms` and `/legal/privacy` pages; calculate VAT in checkout flows.

## App Flow Integration

* **Stack-Aligned Flow:**
  * Next.js 14 Auth Flow → `app/auth/(login|register|forgot-password)/page.tsx` using server actions and NextAuth JWT strategy
  * Product Catalog → `app/products/page.tsx` fetches via server component from REST API or direct DB query
  * Checkout Flow → `app/checkout/page.tsx` triggers Stripe client SDK and webhooks in `app/api/stripe/route.ts`
  * User Portal → `app/dashboard/page.tsx` uses React Server Components to render purchases and embeds chat interface via client components
  * Admin Dashboard → `app/admin/page.tsx` protected by role-based middleware

## Best Practices

* React 18
  * Use functional components and hooks only
  * Leverage Suspense for data fetching
  * Use memoization (`useMemo`, `useCallback`) sparingly

* Next.js 14
  * Use App Router with layouts and nested directories
  * Prefer Server Components for data fetching
  * Store secrets in environment variables and use `next.config.js`

* V0 by Vercel
  * Generate AI-powered UI components for search and filters
  * Integrate V0 tokens in CI/CD pipelines

* Tailwind CSS
  * Create a design system with custom colors and spacing in `tailwind.config.js`
  * Use `@apply` for common utility patterns

* Styled-Components
  * Define theming with `ThemeProvider`
  * Avoid global styles unless necessary

* Node.js & Express
  * Use async/await and centralized error handling
  * Validate inputs with Zod or Joi

* PostgreSQL
  * Use connection pooling
  * Migrate schema changes via Prisma Migrate or TypeORM

* AWS S3
  * Use presigned URLs for uploads
  * Enable lifecycle rules for cleanup

* JWT
  * Store tokens in HTTP-only secure cookies
  * Rotate and revoke tokens on password change

* Stripe
  * Idempotency keys for critical operations
  * Webhook signature verification

* OpenAI & Anthropic APIs
  * Stream responses to the client
  * Cache embeddings or common completions

* Cursor IDE
  * Leverage AI code generation for boilerplate
  * Review and audit generated code

* GitHub
  * Enforce PR reviews and CI checks
  * Use Dependabot for dependency updates

* AWS CloudWatch / Datadog
  * Centralize logs and metrics
  * Alert on error rate and latency spikes

* Sentry
  * Initialize both on client and server
  * Tag errors with user and request context

## Rules

* Derive folder/file patterns **directly** from `techStackDoc` versions.
* If Next.js 14 App Router: Enforce `app/` directory with nested route folders.
* If Pages Router: Use `pages/*.tsx` flat structure.
* Mirror this logic for React Router, SvelteKit, etc.
* Never mix version patterns (e.g., no `pages/` in App Router projects).

## Rules Metrics

Before starting the project development, create a metrics file in the root of the project called `cursor_metrics.md`.

### Instructions:

* Each time a cursor rule is used as context, update `cursor_metrics.md`.
* Use the following format for `cursor_metrics.md`:

    # Rules Metrics

    ## Usage
    The number of times rules is used as context

    * rule-name.mdc: 5
    * another-rule.mdc: 2
    * ...other rules
