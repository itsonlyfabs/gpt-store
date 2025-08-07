"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Reviews from "@/components/Reviews";
import { Check } from "lucide-react";
import Sidebar from '@/components/Sidebar';

export default function BundleDetailsPage() {
  const params = useParams() as Record<string, string>;
  const id = params.id;
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [bundle, setBundle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [alreadyAdded, setAlreadyAdded] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showForceAuthModal, setShowForceAuthModal] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [bundleReviews, setBundleReviews] = useState([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsSignedIn(!!session);
      if (!session) setShowAuthModal(true);
    });
  }, [supabase]);

  useEffect(() => {
    const fetchBundle = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/bundles/${id}`);
        if (!res.ok) throw new Error("Failed to fetch bundle");
        const data = await res.json();
        setBundle(data);
        // Check if already in user's library
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id;
        if (userId) {
          const { data: existing } = await supabase
            .from('user_bundles')
            .select('id')
            .eq('user_id', userId)
            .eq('bundle_id', id)
            .single();
          if (existing && existing.id) setAlreadyAdded(true);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load bundle");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchBundle();
    // Fetch reviews for this bundle
    const fetchReviews = async () => {
      try {
        const res = await fetch(`/api/reviews?bundleId=${id}`);
        if (!res.ok) throw new Error('Failed to fetch reviews');
        const data = await res.json();
        setBundleReviews(data.reviews || []);
      } catch {
        setBundleReviews([]);
      }
    };
    if (id) fetchReviews();
  }, [id, supabase]);

  const handleAddToLibrary = async () => {
    setAdding(true);
    setAdded(false);
    try {
      const { data } = await supabase.auth.getSession();
      const session = data?.session;
      if (!session) {
        setShowAuthModal(true);
        setAdding(false);
        return;
      }
      // Check again before adding
      const { data: existing } = await supabase
        .from('user_bundles')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('bundle_id', id)
        .single();
      if (existing && existing.id) {
        setAlreadyAdded(true);
        setAdding(false);
        return;
      }
      const res = await fetch(`/api/my-library/bundles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ bundleId: id }),
      });
      if (!res.ok) throw new Error("Failed to add bundle to library");
      setAdded(true);
      setAlreadyAdded(true);
    } catch (err) {
      alert("Failed to add bundle to library");
    } finally {
      setAdding(false);
    }
  };

  if (loading) return <div className="flex h-screen bg-gray-50"><Sidebar /><main className="flex-1 overflow-y-auto p-4 md:p-8 pt-16 md:pt-8 text-center">Loading...</main></div>;
  if (error) return <div className="flex h-screen bg-gray-50"><Sidebar /><main className="flex-1 overflow-y-auto p-4 md:p-8 pt-16 md:pt-8 text-center text-red-500">{error}</main></div>;
  if (!bundle) return <div className="flex h-screen bg-gray-50"><Sidebar /><main className="flex-1 overflow-y-auto p-4 md:p-8 pt-16 md:pt-8 text-center text-gray-500">Bundle not found.</main></div>;

  // If not signed in, do not render this page at all (let the homepage or previous page remain), just show the modal if needed
  if (!isSignedIn && showAuthModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 md:p-8 relative text-center">
          <button
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl"
            onClick={() => setShowAuthModal(false)}
            aria-label="Close"
          >
            &times;
          </button>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">Sign up for free to unlock details!</h2>
          <p className="text-gray-600 mb-4 text-sm md:text-base">Create a free account to access bundle details and enjoy these benefits:</p>
          <ul className="text-left mb-6 space-y-2 max-w-xs mx-auto text-sm md:text-base">
            <li className="flex items-center gap-2"><span className="text-primary">✓</span> Access exclusive AI bundles</li>
            <li className="flex items-center gap-2"><span className="text-primary">✓</span> Save your favorites</li>
            <li className="flex items-center gap-2"><span className="text-primary">✓</span> Get personalized recommendations</li>
            <li className="flex items-center gap-2"><span className="text-primary">✓</span> 100% free, no credit card required</li>
          </ul>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                localStorage.setItem('redirectAfterLogin', `/bundle/${id}`);
                router.push('/auth/register');
              }}
              className="w-full px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:opacity-90 transition text-sm md:text-base"
            >
              Sign up for free
            </button>
            <button
              onClick={() => {
                localStorage.setItem('redirectAfterLogin', `/bundle/${id}`);
                router.push('/auth/login');
              }}
              className="w-full px-6 py-3 border border-primary text-primary rounded-lg font-semibold hover:bg-primary/10 transition text-sm md:text-base"
            >
              Sign in
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pt-16 md:pt-8">
          <div className="max-w-5xl mx-auto">
            {/* Mobile-optimized layout */}
            <div className="space-y-6 md:space-y-8">
              {/* Bundle Header - Mobile optimized */}
              <div className="space-y-4">
                <div className="relative">
                  <Image 
                    src={bundle.image} 
                    alt={bundle.name || "Bundle image"} 
                    width={800} 
                    height={320} 
                    unoptimized 
                    className="w-full h-48 md:h-64 object-cover rounded-lg" 
                  />
                  <span className={`absolute top-2 right-2 px-2 py-1 text-xs font-semibold rounded-full ${bundle.tier === 'FREE' ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-yellow-100 text-yellow-700 border border-yellow-300'}`}>
                    {bundle.tier}
                  </span>
                </div>
                <div className="space-y-2">
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">{bundle.name}</h1>
                  <p className="text-gray-600 text-sm md:text-base leading-relaxed">{bundle.description}</p>
                </div>
              </div>

              {/* Mobile Add to Library Button - Fixed at bottom on mobile */}
              <div className="md:hidden">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                  {alreadyAdded ? (
                    <div className="flex items-center justify-center gap-2 text-green-600 font-medium text-sm">
                      <Check className="w-4 h-4" />
                      Already in your library!
                    </div>
                  ) : added ? (
                    <div className="flex items-center justify-center gap-2 text-green-600 font-medium text-sm">
                      <Check className="w-4 h-4" />
                      Added to your library!
                    </div>
                  ) : (
                    <button
                      onClick={e => { e.stopPropagation(); handleAddToLibrary(); }}
                      className="w-full px-4 py-3 bg-primary text-white rounded-lg hover:opacity-90 transition-colors duration-200 disabled:opacity-60 font-medium text-sm"
                      disabled={adding}
                    >
                      {adding ? "Adding..." : "Add to My Library"}
                    </button>
                  )}
                </div>
              </div>

              {/* Products in bundle - Mobile optimized */}
              {Array.isArray(bundle.products) && bundle.products.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900">What's Inside This Bundle</h2>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
                    {bundle.products.map((product: any) => (
                      <div
                        key={product.id}
                        className="bg-white border border-primary/10 rounded-xl shadow-sm p-4 md:p-6 flex flex-col gap-2 hover:shadow-md transition-shadow duration-200"
                      >
                        <div className="mb-2">
                          <span className="text-base md:text-lg font-bold text-primary block truncate">{product.name}</span>
                        </div>
                        <p className="text-gray-600 text-xs md:text-sm line-clamp-3 leading-relaxed">{product.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reviews */}
              {Array.isArray(bundleReviews) && bundleReviews.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900">User Reviews</h2>
                  <Reviews bundleId={bundle.id} className="mt-4 md:mt-8" />
                </div>
              )}
            </div>

            {/* Desktop Add to Library - Hidden on mobile */}
            <div className="hidden md:block lg:col-span-1">
              <div className="bg-white p-6 rounded-lg shadow-sm sticky top-8" onClick={e => e.stopPropagation()}>
                {alreadyAdded ? (
                  <span className="text-green-600 font-medium">Already in your library!</span>
                ) : added ? (
                  <span className="text-green-600 font-medium">Added to your library!</span>
                ) : (
                  <button
                    onClick={e => { e.stopPropagation(); handleAddToLibrary(); }}
                    className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-colors duration-200 disabled:opacity-60"
                    disabled={adding}
                  >
                    {adding ? "Adding..." : "Add to My Library"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
} 