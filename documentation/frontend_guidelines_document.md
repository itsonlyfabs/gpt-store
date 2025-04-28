# Frontend Guideline Document

This document outlines the frontend architecture, design principles, and technologies for the GPT Store project. It’s written in everyday language to ensure clarity for all team members.

## 1. Frontend Architecture

### 1.1 Overview

- **Frameworks & Libraries**
  - **Next.js**: Handles server-side rendering (SSR), static site generation, and file-based routing.
  - **React**: Core UI library for building interactive components.
  - **V0 by Vercel**: AI-powered component builder that accelerates common UI patterns.
  - **Tailwind CSS**: Utility-first styling framework for rapid, consistent design.

### 1.2 Scalability, Maintainability & Performance

- **Modular Code**: Components live in a clear folder structure (`/components/atoms`, `/molecules`, `/organisms`).
- **Code Splitting**: Next.js automatically creates small bundles per page.
- **Server-Side & Static Rendering**: Pages that can be pre-rendered are built at deploy time, speeding up page loads.
- **AI-Assisted Development**: V0 components reduce boilerplate and maintain consistent patterns.

## 2. Design Principles

### 2.1 Key Principles

- **Usability**: Clear navigation, consistent buttons, and form feedback.
- **Accessibility**: WCAG 2.1 AA compliance—semantic HTML, proper color contrast, keyboard navigation.
- **Responsiveness**: Fluid layouts and breakpoints ensure the app works from mobile to desktop.
- **Minimalism**: Focus on content—avoid unnecessary UI chrome.

### 2.2 Applying the Principles

- **Navigation**: A persistent sidebar on desktop, a hamburger menu on mobile.
- **Forms & Inputs**: Labels always visible, inline error messages, focus indicators.
- **Feedback**: Loading spinners, toasts for success/errors, clear status messages.

## 3. Styling and Theming

### 3.1 Styling Approach

- **Tailwind CSS**: Utility classes in markup for margins, padding, typography, colors.
- **No BEM/SMACSS**: Tailwind’s atomic utilities replace traditional CSS methodologies.
- **Optional Styled-Components**: For dynamic or deeply themable UI, though Tailwind covers most cases.

### 3.2 Theming

- **Light Mode & Dark Mode**: Leverage Tailwind’s `dark:` modifier. User preference stored in local storage.
- **Design Tokens**: Defined in `tailwind.config.js` for colors, spacing, font sizes.

### 3.3 Visual Style

- **Style**: Flat, modern, minimalist.
- **Color Palette**:
  - **Primary Blue**: #3B82F6 (buttons, links)
  - **Secondary Gray**: #6B7280 (text, icons)
  - **Background Light**: #FFFFFF
  - **Background Dark**: #1F2937
  - **Accent Green**: #10B981 (success states)
  - **Accent Red**: #EF4444 (errors)

- **Typography**:
  - **Font Family**: Inter, sans-serif
  - **Headings**: `font-bold`, `leading-tight`
  - **Body**: `font-normal`, `leading-relaxed`

## 4. Component Structure

### 4.1 Folder Organization

```
/components
  /atoms      (buttons, inputs, icons)
  /molecules  (form groups, cards)
  /organisms  (navbar, sidebar, footer)
  /templates  (page layouts)
/pages        (Next.js pages and API routes)
/utils        (helper functions, constants)
/hooks        (custom React hooks)
```

### 4.2 Reuse & Maintainability

- **Single Responsibility**: Each component does one thing, making it easy to test and update.
- **Props & Slots**: Pass data via props; use `children` for flexible layouts.
- **Documented Props**: JSDoc comments or TypeScript types clarify expected inputs.

## 5. State Management

### 5.1 Approach

- **React Context + useReducer**: For global UI state (theme, user session).
- **Server State**: **SWR** (or React Query) for data fetching, caching, and revalidation.
- **Local State**: useState/useReducer within components for form inputs, modals.

### 5.2 Shared State Flow

1. **Authentication**: JWT stored in an HTTP-only cookie; React Context holds user info.
2. **Data Fetching**: SWR hooks in components request product lists, user purchases, etc.
3. **Updates**: Mutations (e.g., purchase actions) trigger SWR revalidation.

## 6. Routing and Navigation

### 6.1 Next.js File-Based Routing

- **Pages Folder**: `/pages/index.js` (home), `/pages/products/[id].js` (product details), `/pages/dashboard/*` (user portal).
- **API Routes**: `/pages/api/*` for backend endpoints (if needed).

### 6.2 Navigation Structure

- **Public**: Home, Browse, Product Details, Sign In/Up.
- **User Portal**: Dashboard (My Library, Billing, Account, Support).
- **Admin**: `/admin` protected routes for analytics and user management.
- **Linking**: Use Next.js `<Link>` for client-side transitions.

## 7. Performance Optimization

- **Image Optimization**: `next/image` for automatic resizing and lazy loading.
- **Code Splitting**: Dynamic `import()` for heavy components (e.g., charts).
- **Tree-Shaking**: Ensure unused code is eliminated in production builds.
- **Caching**: CDN for static assets (Vercel built-in), SWR caching for API data.
- **Lazy Hydration**: Use `next/dynamic` with `ssr: false` for non-critical widgets.

## 8. Testing and Quality Assurance

### 8.1 Testing Strategy

- **Unit Tests**: Jest + React Testing Library for components and hooks.
- **Integration Tests**: Test component interactions (forms, modals).
- **End-to-End Tests**: Cypress for critical user flows (signup, checkout).

### 8.2 Tools & Config

- **ESLint + Prettier**: Enforce code style and catch common errors.
- **TypeScript (optional)**: Adds compile-time safety.
- **CI Pipeline**: GitHub Actions—runs lint, tests, and builds on each PR.

## 9. Conclusion and Overall Frontend Summary

This guideline lays out a clear, modern frontend setup:

- **Architecture** built on Next.js, React, and AI-assisted components for scalability.
- **Design Principles** that prioritize usability, accessibility, and minimalism.
- **Styling** using Tailwind CSS with a neutral, flat aesthetic and dark-mode support.
- **Component Structure** that’s modular and reusable.
- **State Management** via React Context and SWR for smooth data flow.
- **Routing** nicely handled by Next.js file conventions.
- **Performance** kept high through image optimization, code splitting, and caching.
- **Quality Assurance** ensured with robust testing and automated linting.

Together, these guidelines align with project goals—delivering a fast, reliable, and user-friendly GPT Store experience.