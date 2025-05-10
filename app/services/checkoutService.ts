import { loadStripe } from '@stripe/stripe-js';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const supabase = createClientComponentClient();

interface CheckoutOptions {
  sessionId?: string;
  success_url?: string;
}

export const checkoutService = {
  // Process checkout with proper error handling
  processCheckout: async function(productId: string, options: CheckoutOptions = {}) {
    try {
      // Validate product ID
      if (!productId) {
        throw new Error("Product ID is required for checkout");
      }

      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        // Store checkout data for after login
        localStorage.setItem('checkoutAfterLogin', JSON.stringify({
          productId,
          priceType: 'one_time' // Default to one_time if not specified
        }));
        
        // Redirect to login
        window.location.href = '/auth/login';
        return false;
      }

      // If we have a success_url from the server, use that directly
      if (options.success_url) {
        window.location.href = options.success_url;
        return true;
      }

      // If we have a sessionId, redirect to Stripe checkout
      if (options.sessionId) {
        const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
        if (!stripe) {
          throw new Error('Failed to initialize Stripe');
        }
        
        const { error } = await stripe.redirectToCheckout({
          sessionId: options.sessionId
        });

        if (error) {
          throw error;
        }

        return true;
      }

      throw new Error('Invalid checkout options provided');
    } catch (error) {
      console.error("Checkout error:", error);
      this.showErrorMessage(error instanceof Error ? error.message : "Checkout failed. Please try again.");
      return false;
    }
  },
  
  // Display error message to user
  showErrorMessage: function(message: string) {
    alert(message);
  }
}; 