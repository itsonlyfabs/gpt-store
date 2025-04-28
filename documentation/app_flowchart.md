flowchart TD
  A[Start] --> B{New user}  
  B -- Yes --> C[Email verification signup]  
  B -- No --> D[Returning user login]  
  C --> E[User dashboard]  
  D --> E  
  E --> F[Search bar and category carousel]  
  E --> G[Sidebar navigation]  
  F --> H{Browse or Search}  
  H -- Browse --> I[Category listing]  
  H -- Search --> J[Search results]  
  I --> K[Product listing with filters]  
  J --> K  
  K --> L[Product details with purchase options]  
  L --> M[Checkout via Stripe modal]  
  M --> N[User portal access]  
  N --> O[Open Chat, Download templates, Get API keys]  
  E --> P[Account management]  
  P --> Q[Profile settings]  
  P --> R[Subscription management]  
  P --> S[Refund request]  
  E --> T[Admin dashboard]  
  T --> U[Sales monitoring]  
  T --> V[User management]  
  T --> W[Analytics]