"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Reviews from "@/components/Reviews";
import { Check } from "lucide-react";

export default function BundleDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [bundle, setBundle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    const fetchBundle = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/bundles/${id}`);
        if (!res.ok) throw new Error("Failed to fetch bundle");
        const data = await res.json();
        setBundle(data);
      } catch (err: any) {
        setError(err.message || "Failed to load bundle");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchBundle();
  }, [id]);

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
    } catch (err) {
      alert("Failed to add bundle to library");
    } finally {
      setAdding(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!bundle) return <div className="p-8 text-center text-gray-500">Bundle not found.</div>;

  return (
    <div className="min-h-screen bg-gray-50" onClick={() => router.push("/")}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left/Main column */}
          <div className="lg:col-span-2 space-y-8">
            <div>
              <div className="relative">
                <Image src={bundle.image} alt={bundle.name || "Bundle image"} width={800} height={320} unoptimized className="w-full h-64 object-cover rounded-lg" />
                <span className={`absolute top-2 right-2 px-3 py-1 text-xs font-semibold rounded-full ${bundle.tier === 'FREE' ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-yellow-100 text-yellow-700 border border-yellow-300'}`}>{bundle.tier}</span>
              </div>
              <h1 className="mt-6 text-3xl font-bold text-gray-900">{bundle.name}</h1>
              <p className="mt-2 text-gray-600">{bundle.description}</p>
            </div>
            {/* Products in bundle */}
            {Array.isArray(bundle.products) && bundle.products.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-2 justify-center w-full max-w-md mx-auto">
                {bundle.products.map((product: any) => (
                  <span
                    key={product.id}
                    className="px-3 py-1 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs font-medium shadow-sm cursor-default transition-colors duration-150 text-center truncate"
                  >
                    {product.name}
                  </span>
                ))}
              </div>
            )}
            {/* Features */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Features</h2>
              <ul className="space-y-4">
                {(bundle.features || []).map((feature: string, index: number) => (
                  <li key={index} className="flex items-start">
                    <Check className="h-6 w-6 text-green-500 flex-shrink-0" />
                    <span className="ml-3 text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            {/* Reviews */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">User Reviews</h2>
              <Reviews bundleId={bundle.id} className="mt-8" />
            </div>
          </div>
          {/* Right column - Add to Library action */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-lg shadow-sm sticky top-8" onClick={e => e.stopPropagation()}>
              {added ? (
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
        {/* Auth Modal for sign up/sign in */}
        {showAuthModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40" onClick={e => e.stopPropagation()}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative text-center">
              <button
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl"
                onClick={() => setShowAuthModal(false)}
                aria-label="Close"
              >
                &times;
              </button>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign up for free to unlock bundle details!</h2>
              <p className="text-gray-600 mb-4">Create a free account to add this bundle to your library and enjoy these benefits:</p>
              <ul className="text-left mb-6 space-y-2 max-w-xs mx-auto">
                <li className="flex items-center gap-2"><span className="text-primary">✓</span> Access exclusive AI bundles</li>
                <li className="flex items-center gap-2"><span className="text-primary">✓</span> Save your favorites</li>
                <li className="flex items-center gap-2"><span className="text-primary">✓</span> Get personalized recommendations</li>
                <li className="flex items-center gap-2"><span className="text-primary">✓</span> 100% free, no credit card required</li>
              </ul>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => {
                    localStorage.setItem('redirectAfterLogin', `/bundle/${bundle.id}`);
                    router.push('/auth/register');
                  }}
                  className="w-full sm:w-auto px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:opacity-90 transition"
                >
                  Sign up for free
                </button>
                <button
                  onClick={() => {
                    localStorage.setItem('redirectAfterLogin', `/bundle/${bundle.id}`);
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
      </div>
    </div>
  );
} 