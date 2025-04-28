# Implementation plan

## Phase 1: Environment Setup

1. Prevalidation: In project root, run `test -f package.json && echo "Project already initialized" || echo "No package.json found"` to check if a Node.js project exists before initializing a new one (Personal GPT Store Summary: Development Environment).
2. If no `package.json` exists, initialize Node.js project: `npm init -y` in the root directory (Personal GPT Store Summary: Development Environment).
3. Validation: Run `node -v` and `npm -v` and ensure Node.js is v20.2.1 or above (Tech Stack: Backend).
4. Initialize Git repository if not present: `git rev-parse --is-inside-work-tree || git init` (Personal GPT Store Summary: Development Environment).
5. Create `.cursor` directory and `cursor_metrics.md` in the root; refer to `cursor_project_rules.mdc` for metrics guidelines (Tech Stack: Development Environment).
6. Create `.gitignore` if missing and add `node_modules/`, `/.cursor/mcp.json`, `.env.local`, `*.log` entries (Security Considerations).
7. Install Next.js 14, React, and ReactDOM exactly: `npm install next@14 react react-dom` (Tech Stack: Frontend).
8. Install Tailwind CSS and dependencies:
   ```bash
   npm install -D tailwindcss@3.3.2 postcss@8.4.18 autoprefixer@10.4.14
   npx tailwindcss init -p
   ```
   This generates `tailwind.config.js` and `postcss.config.js` (Tech Stack: Frontend).
9. Configure `tailwind.config.js` with:
   ```js
   module.exports = {
     content: ["./pages/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
     theme: { extend: {} },
     plugins: []
   };
   ```
   (Tech Stack: Frontend).
10. Create `styles/globals.css` at project root with:
    ```css
    @tailwind base;
    @tailwind components;
    @tailwind utilities;
    ```
    (Tech Stack: Frontend).
11. Create project structure:
    ```
    /pages      # Next.js pages
    /components # React UI components
    /public     # static assets (images, templates)
    ```
    (Personal GPT Store Summary: Development Environment).
12. Create `.env.local` at project root with placeholders:
    ```env
    NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<your-stripe-publishable-key>
    OPENAI_API_KEY=<your-openai-key>
    ANTHROPIC_API_KEY=<your-anthropic-key>
    JWT_SECRET=<your-jwt-secret>
    DATABASE_URL=postgresql://postgres:password@localhost:5432/gptstore
    AWS_ACCESS_KEY_ID=<aws-key>
    AWS_SECRET_ACCESS_KEY=<aws-secret>
    AWS_REGION=us-east-1
    S3_BUCKET_NAME=gpt-store-assets
    ```
    (Tech Stack: Frontend, Backend).

## Phase 2: Frontend Development

13. Create `components/SearchBar.js` with a controlled input and an `onSearch(query)` prop, styled via Tailwind (App Flow: Discover Page).
14. Create `components/Sidebar.js` exporting navigation links: Discover, My Library, Billing, Account Settings, Support (App Flow: Discover Page).
15. Create `pages/discover.js` that imports `SearchBar` and `Sidebar`, fetches `GET ${NEXT_PUBLIC_API_URL}/products` on mount, and renders featured categories (App Flow: Discover Page).
16. Create `pages/browse.js` that reads query params (`category`, `priceType`, `currency`) and fetches filtered products from `GET ${NEXT_PUBLIC_API_URL}/products` (App Flow: Browsing).
17. Create `components/ProductCard.js` to display a product's `name`, `price`, and `thumbnail`, linking to `/product/[id]` (App Flow: Browsing).
18. Create `pages/product/[id].js` to fetch `GET ${NEXT_PUBLIC_API_URL}/products/:id`, display details, sample interactions, reviews, and a dynamically updating purchase button (App Flow: Product Details).
19. Create `components/Reviews.js` to fetch `GET ${NEXT_PUBLIC_API_URL}/reviews?productId=:id` and render star ratings/comments (App Flow: Product Details).
20. Install Stripe React SDK: `npm install @stripe/stripe-js@1.45.0 @stripe/react-stripe-js@1.13.0` (Project Summary: Payment Processing).
21. Create `components/CheckoutButton.js` using `loadStripe(NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)` and `useStripe` to call `POST ${NEXT_PUBLIC_API_URL}/payments/checkout` with `productId` and `priceType` then redirect to session URL (App Flow: Checkout).
22. Create `pages/my-library.js` to fetch `GET ${NEXT_PUBLIC_API_URL}/user/library` with JWT in `Authorization` header and list purchased GPTs with buttons "Open Chat", "Download Templates", "View API Key" (App Flow: My Library).
23. Create `pages/chat/[id].js` rendering a chat UI that opens a WebSocket/SSE connection to `${NEXT_PUBLIC_API_URL}/chat/:id` for streaming responses, displaying usage metrics (App Flow: GPT Interaction).
24. Create `components/AuthGuard.js` to check for a valid JWT in `localStorage` or cookie and redirect to `/login` if missing (App Flow: User Access & Authentication).
25. Validation: Run `npm run dev` and verify Discover and Browse pages fetch live data (App Flow: Discover Page).

## Phase 3: Backend Development

26. In `backend/`, initialize Node.js: `cd backend && npm init -y` (Tech Stack: Backend).
27. Install dependencies:
    ```bash
    npm install express@4.18.2 pg@8.11.1 cors@2.8.5 dotenv@16.0.3 stripe@11.18.0 jsonwebtoken@9.0.0 bcrypt@5.1.0 @aws-sdk/client-s3@3.375.0 ws
    ```
    (Tech Stack: Backend).
28. Create `backend/src/index.js`:
    - `require('dotenv').config()`
    - instantiate `express()`
    - apply `cors({ origin: 'http://localhost:3000', credentials: true })`
    - `app.use(express.json())`
    - mount routers under `/api/v1`
    - `app.listen(process.env.PORT||4000)` (Security Considerations).
29. Create `backend/db/schema.sql` defining tables:
    ```sql
    CREATE TABLE users(...);
    CREATE TABLE products(...);
    CREATE TABLE purchases(...);
    CREATE TABLE reviews(...);
    CREATE TABLE subscriptions(...);
    CREATE TABLE credits(...);
    ```
    Details per PRD's Products Offered (Project Summary: Products Offered).
30. Validation: Launch PostgreSQL 15.3 via Docker:
    ```bash
    docker run --name gptstore-db -e POSTGRES_PASSWORD=password -e POSTGRES_USER=postgres -e POSTGRES_DB=gptstore -p 5432:5432 -d postgres:15.3
    psql $DATABASE_URL -f backend/db/schema.sql
    ```
    (Tech Stack: Database).
31. Create `backend/src/middleware/auth.js` to verify JWT from `Authorization` header, attach `req.user` (Security Considerations).
32. Create `backend/src/routes/auth.js`:
    - `POST /register` hashes password with bcrypt and inserts into `users`
    - `POST /login` verifies credentials and returns JWT (App Flow: Onboarding).
33. Create `backend/src/routes/products.js`:
    - `GET /` returns all products
    - `GET /:id` returns details for one product (App Flow: Browsing, Product Details).
34. Create `backend/src/routes/reviews.js`:
    - `GET /?productId=` returns reviews
    - `POST /` protected route to add a review (App Flow: Product Details).
35. Create `backend/src/routes/payments.js` using Stripe SDK:
    - `POST /checkout` creates a session for one-time, subscription, or credits
    - `POST /webhook` handles `checkout.session.completed` and billing events, updating `purchases`, `subscriptions`, `credits` (Project Summary: Payment Processing).
36. Create `backend/src/services/aiService.js` exposing `chatWithGPT(userId, productId, messages)` that calls OpenAI GPT-4 and Anthropic Claude APIs with respective keys (Project Summary: GPT Logic & Hosting).
37. Create `backend/src/routes/chat.js`:
    - `POST /:productId` initiates a WebSocket/SSE stream to send/receive chat messages via `aiService.chatWithGPT` (App Flow: GPT Interaction).
38. Create `backend/src/services/s3.js` using AWS SDK to handle `uploadTemplate(file)` into the `S3_BUCKET_NAME` bucket (Tech Stack: Backend).
39. Update `backend/src/index.js` to serve signed S3 URLs for templates via `GET /templates/:fileName` (App Flow: My Library).
40. Validation: Start backend with `node src/index.js` and test `curl http://localhost:4000/api/v1/products` returns JSON (App Flow: Browsing).

## Phase 4: Integration

41. Update frontend fetch calls to use `NEXT_PUBLIC_API_URL` and include `credentials: 'include'` for JWT (Integration).
42. Ensure Express CORS allows credentials from `http://localhost:3000` (Security Considerations).
43. Wire up `CheckoutButton` to backend session endpoint, handle redirects for success/cancel, and refresh user library on success (App Flow: Checkout).
44. Manual end-to-end test: register → login → browse → purchase → view in library → open chat and verify responses (App Flow: Full Flow).
45. Validation: Automate tests with Postman and Cypress covering auth, product browsing, checkout, and chat (Non-Functional Requirements).

## Phase 5: Deployment

46. **Backend on Render:**
    - Create a Render account and connect to GitHub repository
    - Create a new Web Service:
      ```bash
      # In backend directory
      - Add "start": "node src/index.js" to package.json scripts
      - Create render.yaml:
        services:
          - type: web
            name: gpt-store-backend
            env: node
            buildCommand: npm install
            startCommand: npm start
            envVars:
              - key: NODE_ENV
                value: production
              - key: PORT
                value: 3000
      ```
    - Configure environment variables in Render dashboard
    - Deploy service

47. **Storage Setup:**
    ```bash
    # Update backend code to use Supabase Storage
    - Remove AWS S3 dependencies
    - Add Supabase storage configuration
    - Update file upload/download logic
    ```

48. **Frontend on Vercel:**
    ```bash
    npx vercel login
    npx vercel --prod
    ```
    When prompted, set environment variables in Vercel dashboard:
    - NEXT_PUBLIC_API_URL (Render backend URL)
    - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    - NEXT_PUBLIC_SUPABASE_URL
    - NEXT_PUBLIC_SUPABASE_ANON_KEY

49. **CI/CD:**
    Create `.github/workflows/ci.yml`:
    ```yaml
    name: CI/CD
    on:
      push:
        branches: [main]
      pull_request:
        branches: [main]
    
    jobs:
      test:
        runs-on: ubuntu-latest
        steps:
          - uses: actions/checkout@v2
          - uses: actions/setup-node@v2
            with:
              node-version: '20'
          - name: Install dependencies
            run: |
              npm install
              cd backend && npm install
          - name: Run tests
            run: |
              npm test
              cd backend && npm test
          - name: Run linting
            run: |
              npm run lint
              cd backend && npm run lint
    
      deploy:
        needs: test
        if: github.ref == 'refs/heads/main'
        runs-on: ubuntu-latest
        steps:
          - name: Deploy to Vercel
            run: npx vercel --prod --token ${{ secrets.VERCEL_TOKEN }}
          # Render auto-deploys from main branch
    ```

50. **Monitoring Setup:**
    - Set up Vercel Analytics in dashboard
    - Configure console logging format in backend:
    ```javascript
    // backend/src/utils/logger.js
    const logger = {
      info: (msg, meta = {}) => console.log(JSON.stringify({ level: 'info', msg, ...meta, timestamp: new Date().toISOString() })),
      error: (msg, meta = {}) => console.error(JSON.stringify({ level: 'error', msg, ...meta, timestamp: new Date().toISOString() }))
    };
    ```
    - Document upgrade path to Sentry

**Note:** Update all environment variables in both Vercel and Render dashboards before deploying.
Ensure HTTPS/TLS, secure password hashing, JWT secrets, and PCI-DSS compliance for Stripe are in place.
Document Terms of Service, Privacy Policy, and VAT rules in `/legal` before public launch.