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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products?${searchParams}`);
      
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
      ? `${process.env.NEXT_PUBLIC_API_URL}/bundles`
      : `${process.env.NEXT_PUBLIC_API_URL}/bundles?discover=true`;
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
              <span className="block">Your Personal AI</span>
              <span className="block text-primary gradient-underline" style={{ position: 'relative', zIndex: 1 }}>Enhancement Suite</span>
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl fade-in-up" style={{ animationDelay: '0.3s' }}>
              Discover a curated collection of AI tools designed to enhance your focus, productivity, and personal growth.
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
              const filteredBundles = searchLower
                ? bundles.filter(b => b.name && b.name.toLowerCase().includes(searchLower))
                : bundles;
              const tierFilteredProducts = tierFilter ? filteredProducts.filter(p => (p.tier || 'FREE') === tierFilter) : filteredProducts;
              const tierFilteredBundles = tierFilter ? filteredBundles.filter(b => (b.tier || 'FREE') === tierFilter) : filteredBundles;
              if (tierFilteredProducts.length === 0 && tierFilteredBundles.length === 0) {
                return <div className="text-center text-gray-400 py-10">No results found.</div>;
              }
              return (
                <>
                  {tierFilteredProducts.length > 0 && (
                    <div className="mb-8">
                      <h2 className="text-xl font-bold mb-4">Products</h2>
                      <div className="relative">
                        <button
                          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow rounded-full p-2 hover:bg-gray-100"
                          onClick={() => scrollCarousel(productCarouselRef, 'left')}
                          aria-label="Scroll left"
                          style={{ display: tierFilteredProducts.length > 3 ? 'block' : 'none' }}
                        >
                          &#8592;
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
                          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow rounded-full p-2 hover:bg-gray-100"
                          onClick={() => scrollCarousel(productCarouselRef, 'right')}
                          aria-label="Scroll right"
                          style={{ display: tierFilteredProducts.length > 3 ? 'block' : 'none' }}
                        >
                          &#8594;
                        </button>
                      </div>
                    </div>
                  )}
                  {tierFilteredBundles.length > 0 && (
                    <div>
                      <h2 className="text-xl font-bold mb-4">Bundles</h2>
                      <div className="relative">
                        <button
                          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow rounded-full p-2 hover:bg-gray-100"
                          onClick={() => scrollCarousel(bundleCarouselRef, 'left')}
                          aria-label="Scroll left"
                          style={{ display: tierFilteredBundles.length > 3 ? 'block' : 'none' }}
                        >
                          &#8592;
                        </button>
                        <div
                          ref={bundleCarouselRef}
                          className="flex gap-8 overflow-x-auto scrollbar-hide scroll-smooth px-8"
                          style={{ scrollSnapType: 'x mandatory' }}
                        >
                          {tierFilteredBundles.map(bundle => (
                            <div
                              key={bundle.id}
                              style={{ minWidth: '320px', maxWidth: '320px', scrollSnapAlign: 'start' }}
                              className="px-2"
                            >
                              <div
                                className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300 ease-in-out p-8 flex flex-col items-center justify-center text-center cursor-pointer relative"
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
                          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow rounded-full p-2 hover:bg-gray-100"
                          onClick={() => scrollCarousel(bundleCarouselRef, 'right')}
                          aria-label="Scroll right"
                          style={{ display: tierFilteredBundles.length > 3 ? 'block' : 'none' }}
                        >
                          &#8594;
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