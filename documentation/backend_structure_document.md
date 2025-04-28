# Backend Structure Document

This document outlines the complete backend setup for the personal GPT store focused on mental fitness and personal development. It covers architecture, database design, APIs, hosting, infrastructure, security, monitoring, and maintenance. Anyone reading this will have a clear understanding of how the backend works.

## 1. Backend Architecture

**Overview**
- We use Node.js with Express as our main server framework. This gives us a simple, flexible way to build RESTful APIs.
- We follow a modular, layered architecture:
  - **Routes** handle incoming HTTP requests and map them to controller functions.
  - **Controllers** orchestrate request validation, business logic, and responses.
  - **Services** encapsulate core operations (user management, payments, product catalog, AI calls).
  - **Data Access Layer (DAL)** talks to the database (PostgreSQL) and other data stores (Redis for caching).  
- This separation makes the code easy to maintain, test, and extend.

**Scalability & Performance**
- **Horizontal scaling**: We can run multiple Express instances behind a load balancer.
- **Caching layer**: Redis handles session data and caches frequent queries (product lists, API responses).
- **Asynchronous processing**: Long-running tasks (e.g., generating GPT responses, processing webhooks) go through a job queue (Bull or AWS SQS).
- **Stateless servers**: JWT-based auth means we don’t store sessions on each server. This allows us to add or remove servers without syncing session data.

**Maintainability**
- Clear separation of concerns makes it easy to onboard new developers.
- Configuration via environment variables (12-factor app) keeps secrets out of code.
- Automated tests cover critical business logic.

---

## 2. Database Management

**Database Technology**
- PostgreSQL (relational database) for core data: users, products, orders, subscriptions, reviews.
- Redis (in-memory key-value store) for caching, rate-limiting, and short-lived data (refresh tokens, API call quotas).
- AWS S3 for storing large assets (GPT prompt templates, chatbot configuration files).

**Data Practices**
- Use an ORM (TypeORM or Sequelize) for schema migrations and type-safe queries.
- Regular backups of PostgreSQL with automated snapshots.
- Encryption at rest and in transit for database connections (SSL/TLS).
- Read replicas for analytics workloads, keeping primary DB responsive for writes.

---

## 3. Database Schema

### Human-Readable Description

1. **Users**: store account details, roles, hashed passwords, subscription status, credit balance.
2. **Products**: represent GPT items—chatbots, prompt templates, API bundles—with price, currency, and metadata.
3. **Categories**: predefined groups (Focus, Energy, Clarity, etc.) to classify products.
4. **Product_Categories**: join table linking products and categories (many-to-many).
5. **Reviews**: user feedback on products, with ratings, comments, timestamps.
6. **Orders**: records of purchases—one-time buys, subscription sign-ups, credit top-ups.
7. **Subscriptions**: track user subscriptions (plan type, start/end dates, status).
8. **Payments**: store Stripe payment intents/charges, status, and related order IDs.
9. **Refresh_Tokens**: handle JWT refresh tokens for secure re-authentication.

### SQL Schema (PostgreSQL)

```sql
-- 1. Users
table users (
  id              SERIAL PRIMARY KEY,
  email           VARCHAR(255) UNIQUE NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  role            VARCHAR(50) DEFAULT 'customer',
  credit_balance  INT DEFAULT 0,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

-- 2. Products
table products (
  id            SERIAL PRIMARY KEY,
  title         VARCHAR(255) NOT NULL,
  description   TEXT,
  type          VARCHAR(50) NOT NULL,
  price_cents   INT NOT NULL,
  currency      VARCHAR(3) NOT NULL,
  asset_url     VARCHAR(500),
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

-- 3. Categories
table categories (
  id        SERIAL PRIMARY KEY,
  name      VARCHAR(100) UNIQUE NOT NULL
);

-- 4. Product_Categories
table product_categories (
  product_id  INT REFERENCES products(id) ON DELETE CASCADE,
  category_id INT REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, category_id)
);

-- 5. Reviews
table reviews (
  id          SERIAL PRIMARY KEY,
  user_id     INT REFERENCES users(id) ON DELETE CASCADE,
  product_id  INT REFERENCES products(id) ON DELETE CASCADE,
  rating      SMALLINT CHECK (rating >= 1 AND rating <= 5),
  comment     TEXT,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- 6. Orders
table orders (
  id            SERIAL PRIMARY KEY,
  user_id       INT REFERENCES users(id),
  type          VARCHAR(50) NOT NULL, -- 'one-time', 'subscription', 'credit'
  product_id    INT REFERENCES products(id),
  credits_used  INT,
  total_cents   INT NOT NULL,
  currency      VARCHAR(3) NOT NULL,
  status        VARCHAR(50) DEFAULT 'pending',
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

-- 7. Subscriptions
table subscriptions (
  id             SERIAL PRIMARY KEY,
  user_id        INT REFERENCES users(id),
  plan           VARCHAR(100) NOT NULL,
  start_date     DATE NOT NULL,
  end_date       DATE,
  status         VARCHAR(50) DEFAULT 'active'
);

-- 8. Payments
table payments (
  id              SERIAL PRIMARY KEY,
  order_id        INT REFERENCES orders(id),
  stripe_intent   VARCHAR(255),
  amount_cents    INT,
  currency        VARCHAR(3),
  status          VARCHAR(50),
  created_at      TIMESTAMP DEFAULT NOW()
);

-- 9. Refresh_Tokens
table refresh_tokens (
  id             SERIAL PRIMARY KEY,
  user_id        INT REFERENCES users(id),
  token          VARCHAR(500) NOT NULL,
  expires_at     TIMESTAMP NOT NULL,
  created_at     TIMESTAMP DEFAULT NOW()
);
```  

---

## 4. API Design and Endpoints

We use a RESTful approach with JSON payloads. Authentication happens via JWTs, with a short-lived access token and a longer refresh token.

### Auth Endpoints
- **POST /auth/register**: Create a new user account.
- **POST /auth/login**: Verify credentials, return access + refresh tokens.
- **POST /auth/refresh**: Exchange a valid refresh token for a new access token.
- **POST /auth/logout**: Revoke refresh token.

### User Endpoints
- **GET /users/me**: Fetch current user profile.
- **PUT /users/me**: Update user details (e.g., display name).

### Product & Catalog Endpoints
- **GET /products**: List all GPT products (supports filters: category, price range, popularity, new arrivals).
- **GET /products/:id**: Get details for a single product, including reviews.
- **GET /categories**: List all product categories.
- **GET /products/:id/reviews**: Fetch reviews for a product.

### Search Endpoint
- **GET /search**: Query products by keyword, with filter params.

### Purchase & Payment Endpoints
- **POST /orders**: Create an order (one-time or credit purchase).
- **POST /subscriptions**: Sign up for or update a subscription.
- **POST /payments/create-session**: Create a Stripe Checkout session.
- **POST /webhooks/stripe**: Endpoint to receive Stripe events (payments, refunds).

### Admin Endpoints
- **GET /admin/sales**: Overview of sales metrics.
- **GET /admin/users**: List and manage users.
- **POST /admin/refunds**: Trigger a refund via Stripe API.

### AI Integration Endpoints
- **POST /ai/generate**: Proxy request to OpenAI or Anthropic with rate-limit and caching logic.

---

## 5. Hosting Solutions

We host on AWS for reliability and a unified ecosystem:
- **Compute**: AWS Elastic Container Service (ECS) with Fargate for auto-scaling our Dockerized Node.js app.
- **Database**: Amazon RDS for PostgreSQL with multi-AZ deployment for high availability.
- **Object Storage**: S3 for static assets and GPT configuration files.

**Benefits**
- **Reliability**: AWS SLAs for RDS and ECS.
- **Scalability**: Fargate auto-scales based on CPU/memory.
- **Cost-effectiveness**: Pay-as-you-go pricing; we only pay for what we use.

---

## 6. Infrastructure Components

- **Load Balancer**: AWS Application Load Balancer (ALB) distributes traffic across ECS tasks.
- **Caching**: Redis via AWS ElastiCache for:
  - Caching product lists and AI response results.
  - Session management and JWT revocation checks.
- **CDN**: AWS CloudFront serves static frontend assets and S3-hosted files for low latency globally.
- **Job Queue**: Redis + Bull (or AWS SQS) handles background jobs (email notifications, webhook processing).
- **Secrets Management**: AWS Secrets Manager for JWT secrets, database credentials, API keys.

These components together improve performance, reliability, and user experience.

---

## 7. Security Measures

- **Authentication & Authorization**:
  - JWT access tokens (short-lived) and refresh tokens (managed in DB).
  - Role-based access control (customer vs. admin).
- **Data Encryption**:
  - TLS for all network traffic.
  - Encryption at rest for RDS and S3 buckets.
- **Password Handling**:
  - Bcrypt hashing for passwords.
- **Input Validation**:
  - Joi or Yup to validate request payloads and prevent injection attacks.
- **HTTP Security**:
  - Helmet middleware for security headers.
  - CORS policy limited to whitelisted domains.
- **Payment Security**:
  - Stripe Webhook signature verification.
  - PCI DSS compliance by not storing raw card data on our servers.
- **Regulatory Compliance**:
  - GDPR and data subject rights support (data export, deletion).
  - VAT handling via Stripe’s built-in tax features or an external tax service.

---

## 8. Monitoring and Maintenance

- **Logging & Metrics**:
  - AWS CloudWatch for server logs, metrics, and alarms.
  - Sentry for real-time error tracking.
  - Prometheus/Grafana (optional) for custom dashboards.
- **Alerts**:
  - CPU/memory thresholds on ECS tasks.
  - Error rate spikes in the API.
- **CI/CD**:
  - GitHub Actions pipeline for linting, testing, and deploying to ECS.
- **Backups & Disaster Recovery**:
  - Automated daily snapshots of PostgreSQL.
  - Cross-region replication for critical data.
- **Routine Maintenance**:
  - Regular dependency updates and vulnerability scans.
  - Scheduled downtime windows for major upgrades.

---

## 9. Conclusion and Overall Backend Summary

The backend for the personal GPT store is built on a robust, scalable Node.js + Express foundation, powered by PostgreSQL and Redis for high performance. AWS services (ECS, RDS, S3, CloudFront) ensure reliability and cost-effective scaling. Clear API design, secure authentication, and strong monitoring practices keep user data safe and the system healthy. This architecture supports one-time purchases, subscriptions, credit systems, and integrates AI engines (OpenAI, Anthropic) seamlessly—all while maintaining a maintainable codebase and smooth developer experience.

Unique aspects:
- Comprehensive multi-currency and VAT support via Stripe.
- AI response caching and rate-limit handling to optimize API usage.
- Modular service layers enabling easy extension (new GPT products, third-party APIs).

With this setup, we meet the project’s goals of delivering a secure, reliable, and user-friendly GPT store for mental fitness and personal development.