'use client'

import React, { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import SearchBar from './components/SearchBar'
import CategoryDropdown from '../components/CategoryDropdown'
import RefreshButton from '../components/RefreshButton'
import ProductCard from './components/ProductCard'
import Reviews from './components/Reviews'
import SearchSuggestions from './components/SearchSuggestions'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'

// Dynamic Title Component
const DynamicTitle = () => {
  const [currentPhrase, setCurrentPhrase] = useState('life coach');
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentPhrase(currentPhrase === 'life coach' ? 'team' : 'life coach');
        setIsTransitioning(false);
      }, 150); // Half of the transition duration
    }, 3000);

    return () => clearInterval(interval);
  }, [currentPhrase]);

  return (
    <span 
      className={`inline-block transition-all duration-300 ease-in-out ${
        isTransitioning ? 'opacity-0 transform scale-95' : 'opacity-100 transform scale-100'
      }`}
      style={{ 
        color: currentPhrase === 'life coach' ? '#000000' : '#7F7BBA',
        fontWeight: 'inherit'
      }}
    >
      {currentPhrase}
    </span>
  );
};

export default function Home() {
  const [products, setProducts] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [loading, setLoading] = useState(false)
  const [bundles, setBundles] = useState<any[]>([])
  const [bundlesLoading, setBundlesLoading] = useState(false)
  const [selectedBundle, setSelectedBundle] = useState<any | null>(null)
  const [showBundleModal, setShowBundleModal] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [showBundleAuthModal, setShowBundleAuthModal] = useState(false);
  const [bundleToView, setBundleToView] = useState<any | null>(null);
  const [tierFilter, setTierFilter] = useState<string>('');
  const [signatureOnly, setSignatureOnly] = useState(false);
  const [showBundleInfo, setShowBundleInfo] = useState(false);
  const router = useRouter();
  const supabase = createClientComponentClient();

  // Carousel refs
  const productCarouselRef = useRef<HTMLDivElement>(null);
  const bundleCarouselRef = useRef<HTMLDivElement>(null);

  const scrollCarousel = (ref: React.RefObject<HTMLDivElement>, direction: 'left' | 'right') => {
    if (ref.current) {
      const cardWidth = ref.current.offsetWidth / 3; // 3 cards visible
      ref.current.scrollBy({
        left: direction === 'left' ? -cardWidth : cardWidth,
        behavior: 'smooth',
      });
    }
  };

  const fetchProducts = async (searchValue = '', categoryValue = '') => {
    setLoading(true)
    try {
      const searchParams = new URLSearchParams({
        ...(searchValue && { search: searchValue }),
        ...(categoryValue && { category: categoryValue })
      });
      const response = await fetch(`/api/products?${searchParams}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      
      const data = await response.json();
      setProducts(data);
      setFiltered(data);
    } catch (err) {
      console.error('Error fetching products:', err);
      setProducts([]);
      setFiltered([]);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsSignedIn(!!session);
    });
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsSignedIn(false);
    window.location.reload();
  };

  const handleSearch = (value: string) => {
    console.log('handleSearch', value);
    setSearch(value);
    fetchProducts(value, category);
  }

  const handleCategorySelect = (cat: string) => {
    setCategory(cat);
    fetchProducts(search, cat);
  }

  const handleReset = () => {
    setSearch('');
    setCategory('');
    fetchProducts();
  }

  const categories = [
    'Personal Development',
    'NLP Mindset Work',
    'Emotional Mastery',
    'Business & Productivity',
    'Life Clarity & Purpose',
    'Wellness & Self-Care',
    'Learning & Growth',
    'Communication & Relationships',
    'Signature Collections',
  ];

  const handleBundleClick = async (bundle: any) => {
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setBundleToView(bundle);
      setShowBundleAuthModal(true);
      return;
    }
    router.push(`/bundle/${bundle.id}`);
  }

  useEffect(() => {
    setBundlesLoading(true);
    const url = isSignedIn
      ? `/api/bundles`
      : `/api/bundles?discover=true`;
    fetch(url)
      .then(res => {
        if (!res.ok) {
          throw new Error('Failed to fetch bundles');
        }
        return res.json();
      })
      .then(data => setBundles(data.filter((b: any) => b.is_admin)))
      .catch((err) => {
        console.error('Error fetching bundles:', err);
        setBundles([]);
      })
      .finally(() => setBundlesLoading(false));
  }, [isSignedIn]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header/Navigation */}
        <header className="flex items-center justify-between py-6">
          <div className="flex items-center">
            <Image src="/genio logo dark.png" alt="Genio Logo" width={180} height={40} priority />
          </div>
          <div className="flex items-center space-x-4">
            <Link
              href="/pricing"
              className="text-base font-medium text-gray-500 hover:text-gray-900"
            >
              Pricing
            </Link>
            {isSignedIn ? (
              <button
                onClick={handleLogout}
                className="text-base font-medium text-gray-500 hover:text-gray-900"
              >
                Logout
              </button>
            ) : (
              <Link
                href="/auth/login"
                className="text-base font-medium text-gray-500 hover:text-gray-900"
              >
                Sign in
              </Link>
            )}
            <Link
              href="/auth/register"
              className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary hover:opacity-90"
            >
              Get started
            </Link>
          </div>
        </header>

        {/* Hero Section */}
        <div className="py-12 sm:py-16">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 border border-gray-200 text-base font-medium text-primary shadow-sm backdrop-blur-sm" style={{ fontWeight: 500 }}>
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5 text-primary animated-pulse"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                AI-powered assistants
              </span>
            </div>
            <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl fade-in-up" style={{ animationDelay: '0.1s' }}>
              <span className="block">Your <DynamicTitle />.</span>
              <span className="block text-primary italic">In your pocket.</span>
              <span className="block">Always on.</span>
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl fade-in-up" style={{ animationDelay: '0.3s' }}>
              Get instant access to mindset hacks, clarity exercises, and goal crushers — powered by AI and designed by a real coach.
            </p>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col items-center gap-4 mt-2 mb-12">
          <div className="w-full max-w-xl relative">
            <SearchBar
              value={search}
              onChange={handleSearch}
              onSearch={handleSearch}
              placeholder="Search collections, bundles, assistants..."
              className=""
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            />
          </div>
          <div className="flex w-full max-w-xl gap-2 items-center">
            <CategoryDropdown
              categories={categories}
              selected={category}
              onSelect={handleCategorySelect}
              className="flex-1"
            />
            {/* FREE/PRO filter */}
            <div className="flex gap-2">
              <button
                className={`px-3 py-1 rounded-full border text-xs font-semibold ${tierFilter === '' ? 'bg-primary text-white border-primary' : 'bg-white text-primary border-primary/30'}`}
                onClick={() => setTierFilter('')}
              >
                All
              </button>
              <button
                className={`px-3 py-1 rounded-full border text-xs font-semibold ${tierFilter === 'FREE' ? 'bg-green-100 text-green-700 border-green-300' : 'bg-white text-primary border-primary/30'}`}
                onClick={() => setTierFilter('FREE')}
              >
                FREE
              </button>
              <button
                className={`px-3 py-1 rounded-full border text-xs font-semibold ${tierFilter === 'PRO' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' : 'bg-white text-primary border-primary/30'}`}
                onClick={() => setTierFilter('PRO')}
              >
                PRO
              </button>
            </div>
            <RefreshButton onClick={handleReset} />
          </div>
        </div>

        {/* Bundles & Products Grid (filtered by title) */}
        <div className="py-6">
          {bundlesLoading || loading ? (
            <div className="text-center text-gray-500 py-10">Loading...</div>
          ) : (
            (() => {
              // Filter products and bundles by title
              const searchLower = search.trim().toLowerCase();
              const filteredProducts = searchLower
                ? products.filter(p => p.name && p.name.toLowerCase().includes(searchLower))
                : products;
              const filteredBundlesRaw = searchLower
                ? bundles.filter(b => b.name && b.name.toLowerCase().includes(searchLower))
                : bundles;
              const tierFilteredProducts = tierFilter ? filteredProducts.filter(p => (p.tier || 'FREE') === tierFilter) : filteredProducts;
              const tierFilteredBundles = tierFilter ? filteredBundlesRaw.filter(b => (b.tier || 'FREE') === tierFilter) : filteredBundlesRaw;
              // Apply signatureOnly filter here
              const filteredBundles = signatureOnly ? tierFilteredBundles.filter(b => b.is_signature_collection) : tierFilteredBundles;
              if (tierFilteredProducts.length === 0 && filteredBundles.length === 0) {
                return <div className="text-center text-gray-400 py-10">No results found.</div>;
              }
              return (
                <>
                  {tierFilteredProducts.length > 0 && (
                    <div className="mb-8">
                      <h2 className="text-xl font-bold mb-4">Products</h2>
                      <div className="relative">
                        <button
                          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/95 backdrop-blur-sm shadow-lg rounded-full p-3 hover:bg-white hover:shadow-xl transition-all duration-200 border border-gray-200/50"
                          onClick={() => scrollCarousel(productCarouselRef, 'left')}
                          aria-label="Scroll left"
                          style={{ display: tierFilteredProducts.length > 3 ? 'block' : 'none' }}
                        >
                          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <div
                          ref={productCarouselRef}
                          className="flex gap-8 overflow-x-auto scrollbar-hide scroll-smooth px-8"
                          style={{ scrollSnapType: 'x mandatory' }}
                        >
                          {tierFilteredProducts.map(product => (
                            <div
                              key={product.id}
                              style={{ minWidth: '320px', maxWidth: '320px', scrollSnapAlign: 'start' }}
                              className="px-2"
                            >
                              <ProductCard
                                id={product.id}
                                name={product.name}
                                description={product.description}
                                category={product.category}
                                thumbnail={product.thumbnail}
                                tier={product.tier || 'FREE'}
                              />
                            </div>
                          ))}
                        </div>
                        <button
                          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/95 backdrop-blur-sm shadow-lg rounded-full p-3 hover:bg-white hover:shadow-xl transition-all duration-200 border border-gray-200/50"
                          onClick={() => scrollCarousel(productCarouselRef, 'right')}
                          aria-label="Scroll right"
                          style={{ display: tierFilteredProducts.length > 3 ? 'block' : 'none' }}
                        >
                          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                  {filteredBundles.length > 0 && (
                    <div>
                      <div className="flex items-center mb-6">
                        <h2 className="text-xl font-bold mr-4 px-4 py-2 rounded-lg bg-gradient-to-r from-yellow-100 to-amber-100 border border-yellow-200 shadow-lg" style={{ 
                          boxShadow: '0 0 20px rgba(251, 191, 36, 0.3), 0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                          background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(245, 158, 11, 0.1) 100%)'
                        }}>
                          Bundles
                        </h2>
                        <button
                          className="ml-2 rounded-full border border-gray-300 bg-white w-6 h-6 flex items-center justify-center text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
                          aria-label="What is a bundle?"
                          onClick={() => setShowBundleInfo(true)}
                          type="button"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                        <span className="mr-2 text-sm font-medium text-gray-700">Signature Collection</span>
                        <button
                          type="button"
                          onClick={() => setSignatureOnly(v => !v)}
                          className={`relative inline-flex h-7 w-14 border-2 border-yellow-400 rounded-full transition-colors duration-200 focus:outline-none ${signatureOnly ? 'bg-yellow-300' : 'bg-gray-200'}`}
                          style={{ boxShadow: signatureOnly ? '0 0 0 2px #FFD700' : undefined }}
                        >
                          <span
                            className={`inline-block h-6 w-6 rounded-full bg-white shadow transform transition-transform duration-200 ${signatureOnly ? 'translate-x-7' : 'translate-x-0'}`}
                          />
                        </button>
                      </div>
                      <div className="relative">
                        <button
                          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/95 backdrop-blur-sm shadow-lg rounded-full p-3 hover:bg-white hover:shadow-xl transition-all duration-200 border border-gray-200/50"
                          onClick={() => scrollCarousel(bundleCarouselRef, 'left')}
                          aria-label="Scroll left"
                          style={{ display: filteredBundles.length > 3 ? 'block' : 'none' }}
                        >
                          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <div
                          ref={bundleCarouselRef}
                          className="flex gap-8 overflow-x-auto scrollbar-hide scroll-smooth px-8"
                          style={{ scrollSnapType: 'x mandatory' }}
                        >
                          {filteredBundles.map(bundle => (
                            <div
                              key={bundle.id}
                              style={{ minWidth: '320px', maxWidth: '320px', scrollSnapAlign: 'start' }}
                              className="px-2"
                            >
                              <div
                                className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300 ease-in-out p-8 flex flex-col items-center justify-center text-center cursor-pointer relative"
                                style={{
                                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 0 15px rgba(251, 191, 36, 0.15)',
                                  background: 'linear-gradient(135deg, #ffffff 0%, rgba(251, 191, 36, 0.02) 100%)'
                                }}
                                role="button"
                                tabIndex={0}
                                onClick={async () => {
                                  // Check if user is authenticated
                                  const { data: { session } } = await supabase.auth.getSession();
                                  if (!session) {
                                    setBundleToView(bundle);
                                    setShowBundleAuthModal(true);
                                    return;
                                  }
                                  router.push(`/bundle/${bundle.id}`);
                                }}
                                onKeyPress={async e => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    // Check if user is authenticated
                                    const { data: { session } } = await supabase.auth.getSession();
                                    if (!session) {
                                      setBundleToView(bundle);
                                      setShowBundleAuthModal(true);
                                      return;
                                    }
                                    router.push(`/bundle/${bundle.id}`);
                                  }
                                }}
                              >
                                <div className="relative w-full">
                                  <Image src={bundle.image} alt={bundle.name || 'Bundle image'} width={320} height={192} unoptimized className="w-full h-48 object-cover rounded-xl mb-4" />
                                  <span className={`absolute top-2 right-2 px-3 py-1 text-xs font-semibold rounded-full ${bundle.tier === 'FREE' ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-yellow-100 text-yellow-700 border border-yellow-300'}`}>{bundle.tier}</span>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">{bundle.name}</h3>
                                <p className="text-gray-500">{bundle.description}</p>
                                {Array.isArray(bundle.products) && bundle.products.length > 0 && (
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    {bundle.products.map((product: any) => (
                                      <span key={product.id} className="inline-block px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                                        {product.name}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        <button
                          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/95 backdrop-blur-sm shadow-lg rounded-full p-3 hover:bg-white hover:shadow-xl transition-all duration-200 border border-gray-200/50"
                          onClick={() => scrollCarousel(bundleCarouselRef, 'right')}
                          aria-label="Scroll right"
                          style={{ display: filteredBundles.length > 3 ? 'block' : 'none' }}
                        >
                          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </>
              );
            })()
          )}
        </div>

        {/* Bundle Auth Modal */}
        {showBundleAuthModal && bundleToView && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative text-center">
              <button
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl"
                onClick={() => setShowBundleAuthModal(false)}
                aria-label="Close"
              >
                &times;
              </button>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign up for free to unlock bundle details!</h2>
              <p className="text-gray-600 mb-4">Create a free account to access bundle details and enjoy these benefits:</p>
              <ul className="text-left mb-6 space-y-2 max-w-xs mx-auto">
                <li className="flex items-center gap-2"><span className="text-primary">✓</span> Access exclusive AI bundles</li>
                <li className="flex items-center gap-2"><span className="text-primary">✓</span> Save your favorites</li>
                <li className="flex items-center gap-2"><span className="text-primary">✓</span> Get personalized recommendations</li>
                <li className="flex items-center gap-2"><span className="text-primary">✓</span> 100% free, no credit card required</li>
              </ul>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => {
                    localStorage.setItem('redirectAfterLogin', `/bundle/${bundleToView.id}`);
                    router.push('/auth/register');
                  }}
                  className="w-full sm:w-auto px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:opacity-90 transition"
                >
                  Sign up for free
                </button>
                <button
                  onClick={() => {
                    localStorage.setItem('redirectAfterLogin', `/bundle/${bundleToView.id}`);
                    router.push('/auth/login');
                  }}
                  className="w-full sm:w-auto px-6 py-2 border border-primary text-primary rounded-lg font-semibold hover:bg-primary/10 transition"
                >
                  Sign in
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bundle Info Modal */}
        {showBundleInfo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
            <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative">
              <button
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                onClick={() => setShowBundleInfo(false)}
                aria-label="Close info"
              >
                ×
              </button>
              <h2 className="text-lg font-semibold mb-2">What is a Bundle?</h2>
              <p className="text-sm text-gray-700 mb-2">
                A <span className="font-semibold">Bundle</span> is a curated collection of AI tools designed to work together as a complete coaching system. Each bundle focuses on a specific mindset or goal, combining multiple AI assistants for comprehensive support.
              </p>
              <ul className="text-sm text-gray-700 mb-4 list-disc pl-5">
                <li>Multiple AI tools working together as a team</li>
                <li>Focused on specific goals or mindsets</li>
                <li>Designed by real coaches and experts</li>
                <li>More powerful than individual tools alone</li>
              </ul>
              <button
                onClick={() => {
                  setShowBundleInfo(false);
                  router.push('/auth/register');
                }}
                className="w-full px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:opacity-90 transition"
              >
                Sign up for access
              </button>
            </div>
          </div>
        )}

        {/* CTA Section */}
        <div className="bg-gray-50 rounded-3xl my-16">
          <div className="max-w-2xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              <span className="block">Ready to get started?</span>
              <span className="block">Start your journey today.</span>
            </h2>
            <p className="mt-4 text-lg leading-6 text-gray-700">
              Join thousands of users who are already enhancing their mental capabilities with our AI tools.
            </p>
            <Link
              href="/auth/register"
              className="mt-8 w-full inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary hover:opacity-90 sm:w-auto"
            >
              Sign up for free
            </Link>
          </div>
        </div>
      </div>
      <style jsx global>{`
@keyframes pulse {
  0% { transform: scale(1); filter: drop-shadow(0 0 0 #7F7BBA); }
  50% { transform: scale(1.15); filter: drop-shadow(0 0 8px #7F7BBA88); }
  100% { transform: scale(1); filter: drop-shadow(0 0 0 #7F7BBA); }
}
@keyframes fadeInUp {
  0% { opacity: 0; transform: translateY(30px); }
  100% { opacity: 1; transform: translateY(0); }
}
@keyframes wave {
  0% { background-position-x: 0, 0; }
  100% { background-position-x: 40px, 0; }
}
.animated-pulse { animation: pulse 1.2s cubic-bezier(.4,0,.2,1) infinite; }
.fade-in-up { animation: fadeInUp 1s cubic-bezier(.4,0,.2,1) both; }
.gradient-underline {
  position: relative;
  display: inline-block;
}
.gradient-underline::after {
  content: '';
  display: block;
  height: 9px;
  width: 100%;
  background:
    repeating-linear-gradient(90deg, rgba(127,123,186,0.25) 0px, rgba(127,123,186,0.25) 10px, transparent 10px, transparent 20px),
    linear-gradient(90deg, #7F7BBA 0%, #A18AFF 100%);
  background-size: 40px 12px, 100% 12px;
  background-repeat: repeat-x, no-repeat;
  position: absolute;
  left: 0;
  bottom: -2px;
  z-index: 10;
  border-radius: 4px;
  box-shadow: 0 2px 8px 0 #7F7BBA33;
  animation: fadeInUp 1.2s 0.3s both, wave 3s linear infinite;
}
`}</style>
    </div>
  )
} 