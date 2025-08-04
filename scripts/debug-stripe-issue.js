// Debug script for Stripe checkout issues
// Run this in your browser console on the pricing page

console.log('🔍 Debugging Stripe checkout issue...');

// Check if we're on the pricing page
if (window.location.pathname === '/pricing') {
  console.log('✅ On pricing page');
  
  // Check if Stripe is loaded
  if (typeof Stripe !== 'undefined') {
    console.log('✅ Stripe is loaded');
  } else {
    console.log('❌ Stripe is not loaded');
  }
  
  // Check environment variables (only public ones)
  console.log('📋 Environment check:');
  console.log('- NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:', process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? 'SET' : 'NOT SET');
  console.log('- NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL ? 'SET' : 'NOT SET');
  
  // Check if checkout button exists
  const checkoutButtons = document.querySelectorAll('[data-plan-id]');
  console.log(`📦 Found ${checkoutButtons.length} plan buttons`);
  
  checkoutButtons.forEach(button => {
    const planId = button.getAttribute('data-plan-id');
    console.log(`   - Plan ID: ${planId}`);
  });
}

// Function to test the checkout API directly
async function testCheckoutAPI(planId) {
  try {
    console.log(`🧪 Testing checkout API for plan: ${planId}`);
    
    // Get auth token (you'll need to be logged in)
    const token = localStorage.getItem('supabase.auth.token');
    
    const response = await fetch('/api/plans/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ planId })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Checkout API success:', data);
    } else {
      console.log('❌ Checkout API error:', data);
      console.log('Status:', response.status);
    }
    
    return { success: response.ok, data };
  } catch (error) {
    console.error('❌ Checkout API exception:', error);
    return { success: false, error: error.message };
  }
}

// Add to window for easy testing
window.testCheckoutAPI = testCheckoutAPI;

console.log('💡 To test checkout API, run: testCheckoutAPI("your-plan-id")');
console.log('💡 Check the Network tab in DevTools for the actual API call details'); 