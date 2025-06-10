'use client';
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { marked } from 'marked';

export default function DocumentationArticlePage() {
  const params = useParams() as Record<string, string>;
  const id = params.id;
  const [doc, setDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/documentation/${id}`)
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then(setDoc)
      .catch(() => setDoc(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-8 text-gray-500">Loading...</div>;
  if (!doc) return <div className="p-8 text-red-500">Article not found.</div>;

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">{doc.title}</h1>
      <h2 className="text-lg text-gray-600 mb-6">{doc.subtitle}</h2>
      <div className="prose prose-lg text-gray-800 bg-white p-6 rounded-lg shadow" dangerouslySetInnerHTML={{ __html: marked.parse(doc.context || '') }} />
    </div>
  );
} 