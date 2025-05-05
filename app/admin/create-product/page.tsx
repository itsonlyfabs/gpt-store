"use client";
import { useState } from "react";

export default function CreateProductPage() {
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    thumbnail: "",
    price_type: "one_time",
    currency: "USD",
    features: "",
    assistant_id: ""
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
          price: parseInt(form.price, 10),
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
        price: "",
        category: "",
        thumbnail: "",
        price_type: "one_time",
        currency: "USD",
        features: "",
        assistant_id: ""
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Create New Product</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input name="name" value={form.name} onChange={handleChange} placeholder="Name" className="w-full border p-2" required />
        <textarea name="description" value={form.description} onChange={handleChange} placeholder="Description" className="w-full border p-2" required />
        <input name="price" value={form.price} onChange={handleChange} placeholder="Price (cents)" type="number" className="w-full border p-2" required />
        <input name="category" value={form.category} onChange={handleChange} placeholder="Category" className="w-full border p-2" required />
        <input name="thumbnail" value={form.thumbnail} onChange={handleChange} placeholder="Thumbnail URL" className="w-full border p-2" required />
        <select name="price_type" value={form.price_type} onChange={handleChange} className="w-full border p-2" required>
          <option value="one_time">One Time</option>
          <option value="subscription">Subscription</option>
        </select>
        <input name="currency" value={form.currency} onChange={handleChange} placeholder="Currency (USD)" className="w-full border p-2" required />
        <input name="features" value={form.features} onChange={handleChange} placeholder="Features (comma separated)" className="w-full border p-2" />
        <input name="assistant_id" value={form.assistant_id} onChange={handleChange} placeholder="Assistant ID" className="w-full border p-2" required />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded" disabled={loading}>{loading ? "Creating..." : "Create Product"}</button>
        {success && <div className="text-green-600">{success}</div>}
        {error && <div className="text-red-600">{error}</div>}
      </form>
    </div>
  );
} 