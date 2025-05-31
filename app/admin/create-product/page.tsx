"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateProductPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "",
    thumbnail: "",
    features: "",
    expertise: "",
    personality: "",
    style: "",
    tier: "FREE",
    prompt: ""
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess("");
    setError("");
    try {
      const res = await fetch(process.env.NEXT_PUBLIC_API_URL + "/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          features: form.features.split(",").map(f => f.trim())
        })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create product");
      }
      setSuccess("Product created successfully!");
      setForm({
        name: "",
        description: "",
        category: "",
        thumbnail: "",
        features: "",
        expertise: "",
        personality: "",
        style: "",
        tier: "FREE",
        prompt: ""
      });
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
        onClick={() => router.push('/admin?page=products')}
        aria-label="Close"
      >
        &times;
      </button>
      <h1 className="text-2xl font-bold mb-6">Create New Product</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input name="name" value={form.name} onChange={handleChange} placeholder="Name" className="w-full border p-2" required />
        <textarea name="description" value={form.description} onChange={handleChange} placeholder="Description" className="w-full border p-2" required />
        <input name="category" value={form.category} onChange={handleChange} placeholder="Category" className="w-full border p-2" required />
        <input name="thumbnail" value={form.thumbnail} onChange={handleChange} placeholder="Thumbnail URL" className="w-full border p-2" required />
        <input name="features" value={form.features} onChange={handleChange} placeholder="Features (comma separated)" className="w-full border p-2" />
        <input name="expertise" value={form.expertise} onChange={handleChange} placeholder="Expertise" className="w-full border p-2" required />
        <input name="personality" value={form.personality} onChange={handleChange} placeholder="Personality" className="w-full border p-2" required />
        <input name="style" value={form.style} onChange={handleChange} placeholder="Style" className="w-full border p-2" required />
        <select name="tier" value={form.tier} onChange={handleChange} className="w-full border p-2" required>
          <option value="FREE">FREE</option>
          <option value="PRO">PRO</option>
        </select>
        <textarea name="prompt" value={form.prompt} onChange={handleChange} placeholder="System Prompt (required for customizing chat behavior)" className="w-full border p-2" rows={4} required />
        <div className="flex gap-2 justify-end">
          <button type="button" className="border px-4 py-2 rounded" onClick={() => router.push('/admin?page=products')}>Cancel</button>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded" disabled={loading}>{loading ? "Creating..." : "Create Product"}</button>
        </div>
        {success && <div className="text-green-600">{success}</div>}
        {error && <div className="text-red-600">{error}</div>}
      </form>
    </div>
  );
} 