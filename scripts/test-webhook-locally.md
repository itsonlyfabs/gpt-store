# Testing Stripe Webhooks Locally

## Prerequisites

1. **Install Stripe CLI:**
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe
   
   # Or download from: https://github.com/stripe/stripe-cli/releases
   ```

2. **Login to Stripe:**
   ```bash
   stripe login
   ```

## Steps to Test Webhooks

### 1. Start your backend server locally
```bash
cd backend
npm start
```

### 2. Forward webhooks to your local server
```bash
# For test mode
stripe listen --forward-to localhost:3000/payments/webhook

# For production mode (after switching)
stripe listen --forward-to localhost:3000/payments/webhook --live
```

### 3. Test webhook events
In a new terminal, trigger test events:

```bash
# Test a successful checkout
stripe trigger checkout.session.completed

# Test subscription events
stripe trigger customer.subscription.created
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted

# Test invoice events
stripe trigger invoice.payment_succeeded
stripe trigger invoice.payment_failed
```

### 4. Monitor webhook delivery
The Stripe CLI will show:
- Webhook events being sent
- Response status codes
- Any errors

### 5. Check your database
Verify that the webhook events are properly updating your database:
- Check purchases table for completed orders
- Check subscriptions table for subscription changes

## Troubleshooting

### Common Issues:

1. **Webhook signature verification fails:**
   - Make sure you're using the correct webhook secret
   - The secret from `stripe listen` is different from your production webhook secret

2. **Server not receiving webhooks:**
   - Check if your server is running on the correct port
   - Verify the webhook endpoint path is correct

3. **Database updates not happening:**
   - Check your webhook handler code
   - Verify database connection and permissions

### Useful Commands:

```bash
# List all webhook endpoints
stripe webhook_endpoints list

# Get webhook endpoint details
stripe webhook_endpoints retrieve we_xxx

# Test a specific webhook endpoint
stripe webhook_endpoints test we_xxx --event checkout.session.completed
```

## Production Testing

After deploying to production:

1. **Test with real webhook endpoint:**
   ```bash
   stripe listen --forward-to https://gpt-store-backend.onrender.com/payments/webhook --live
   ```

2. **Verify webhook is registered in Stripe Dashboard:**
   - Go to Developers → Webhooks
   - Check that your endpoint is listed and active

3. **Test with real payment:**
   - Make a small test purchase with a real card
   - Monitor webhook delivery in Stripe Dashboard
   - Check your database for the completed purchase 