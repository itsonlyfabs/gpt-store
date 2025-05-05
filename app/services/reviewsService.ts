interface Review {
  id: string;
  rating: number;
  text: string;
  author: string;
  date: string;
}

interface ReviewsResponse {
  reviews: Review[];
}

export const reviewsService = {
  fetchReviews: async function(productId: string): Promise<ReviewsResponse> {
    try {
      if (!productId) {
        console.warn('Invalid productId provided to fetchReviews');
        return { reviews: [] };
      }

      // Option 1: Try the original endpoint with better error handling
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reviews?productId=${productId}`);
      
      // If 404, try alternative endpoints
      if (response.status === 404) {
        console.log("Trying alternative review endpoint...");
        // Try alternative endpoint structure 
        const altResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${productId}/reviews`);
        
        if (altResponse.ok) {
          return await altResponse.json();
        }
        
        // If both fail, return empty reviews array
        return { reviews: [] };
      }
      
      if (!response.ok) {
        throw new Error(`Failed to fetch reviews. Status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error fetching reviews:", error);
      // Return empty reviews as fallback to prevent UI breaking
      return { reviews: [] };
    }
  },

  displayReviews: function(productId: string, containerElement: HTMLElement | null) {
    if (!containerElement) return;

    // Clear previous content
    containerElement.innerHTML = '<p>Loading reviews...</p>';
    
    this.fetchReviews(productId)
      .then(data => {
        if (!containerElement) return;
        
        if (!data.reviews || data.reviews.length === 0) {
          containerElement.innerHTML = '<p>No reviews available.</p>';
          return;
        }
        
        // Render reviews
        const reviewsHtml = data.reviews
          .map(review => `
            <div class="review">
              <div class="stars">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</div>
              <p class="review-text">${review.text}</p>
              <p class="review-author">- ${review.author}</p>
            </div>
          `)
          .join('');
          
        containerElement.innerHTML = reviewsHtml;
      })
      .catch(err => {
        if (containerElement) {
          containerElement.innerHTML = '<p>Unable to load reviews at this time.</p>';
        }
      });
  }
}; 