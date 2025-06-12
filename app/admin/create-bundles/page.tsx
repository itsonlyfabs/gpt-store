"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function CreateBundlePage() {
  const [products, setProducts] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [form, setForm] = useState({
    name: "",
    description: "",
    image: "",
    tier: "FREE"
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [bundles, setBundles] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetch("/api/products")
      .then(res => res.json())
      .then(setProducts)
      .catch(() => setProducts([]));
    fetch("/api/bundles")
      .then(res => res.json())
      .then(setBundles)
      .catch(() => setBundles([]));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSelect = (id: string) => {
    setSelected(sel => sel.includes(id) ? sel.filter(x => x !== id) : [...sel, id]);
  };

  const handleEdit = (bundle: any) => {
    setEditing(bundle);
    setForm({ name: bundle.name, description: bundle.description, image: bundle.image, tier: bundle.tier || 'FREE' });
    setSelected(bundle.products.map((p: any) => p.id));
    setSuccess("");
    setError("");
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this bundle?")) return;
    setLoading(true);
    setSuccess("");
    setError("");
    try {
      const res = await fetch("/api/bundles/" + id, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete bundle");
      setBundles(bundles => bundles.filter(b => b.id !== id));
      if (editing && editing.id === id) setEditing(null);
      setSuccess("Bundle deleted successfully!");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      const method = editing ? "PUT" : "POST";
      const url = editing ? `/api/admin/bundles/${editing.id}` : "/api/admin/bundles";
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { "Authorization": `Bearer ${accessToken}` } : {})
        },
        body: JSON.stringify({ ...form, productIds: selected }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `Failed to ${editing ? "edit" : "create"} bundle`);
      }
      setSuccess(`Bundle ${editing ? "updated" : "created"} successfully!`);
      setForm({ name: "", description: "", image: "", tier: "FREE" });
      setSelected([]);
      setEditing(null);
      // Refresh bundles list
      fetch("/api/bundles")
        .then(res => res.json())
        .then(setBundles)
        .catch(() => setBundles([]));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-8 relative">
      <button
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold"
        onClick={() => router.push('/admin?page=bundles')}
        aria-label="Close"
      >
        &times;
      </button>
      <h1 className="text-2xl font-bold mb-6">{editing ? "Edit Bundle" : "Create New Bundle"}</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input name="name" value={form.name} onChange={handleChange} placeholder="Bundle Name" className="w-full border p-2" required />
        <textarea name="description" value={form.description} onChange={handleChange} placeholder="Description" className="w-full border p-2" required />
        <input name="image" value={form.image} onChange={handleChange} placeholder="Image URL" className="w-full border p-2" required />
        <select name="tier" value={form.tier} onChange={handleChange} className="w-full border p-2" required>
          <option value="FREE">FREE</option>
          <option value="PRO">PRO</option>
        </select>
        <div>
          <div className="font-semibold mb-2">Select Products for this Bundle:</div>
          <div className="max-h-48 overflow-y-auto border rounded p-2 bg-gray-50">
            {products.length === 0 ? (
              <div className="text-gray-400">No products found.</div>
            ) : products.map((p) => (
              <div key={p.id} className="flex items-center gap-2 mb-1">
                <input
                  type="checkbox"
                  checked={selected.includes(p.id)}
                  onChange={() => handleSelect(p.id)}
                  className="accent-blue-600"
                />
                <span>{p.name}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button type="button" className="border px-4 py-2 rounded" onClick={() => router.push('/admin?page=bundles')}>Cancel</button>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded" disabled={loading}>{loading ? (editing ? "Saving..." : "Creating...") : (editing ? "Save Changes" : "Create Bundle")}</button>
        </div>
        {editing && <button type="button" className="ml-2 px-4 py-2 rounded border" onClick={() => { setEditing(null); setForm({ name: "", description: "", image: "", tier: "FREE" }); setSelected([]); }}>Cancel</button>}
        {success && <div className="text-green-600">{success}</div>}
        {error && <div className="text-red-600">{error}</div>}
      </form>
      <hr className="my-8" />
      <h2 className="text-xl font-bold mb-4">All Bundles</h2>
      <div className="space-y-4">
        {bundles.length === 0 ? <div className="text-gray-400">No bundles found.</div> : bundles.map(bundle => (
          <div key={bundle.id} className="border rounded p-4 flex flex-col gap-2">
            <div className="font-semibold">{bundle.name}</div>
            <div className="text-gray-500 text-sm">{bundle.description}</div>
            <div className="flex gap-2 mt-2">
              <button className="bg-yellow-500 text-white px-3 py-1 rounded" onClick={() => handleEdit(bundle)}>Edit</button>
              <button className="bg-red-600 text-white px-3 py-1 rounded" onClick={() => handleDelete(bundle.id)}>Delete</button>
            </div>
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
        ))}
      </div>
    </div>
  );
} 