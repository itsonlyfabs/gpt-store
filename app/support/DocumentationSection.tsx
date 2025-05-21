"use client";
import React, { useEffect, useState } from "react";

const DocumentationSection = () => {
  const [documentation, setDocumentation] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/documentation?cb=${Date.now()}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data) => setDocumentation(Array.isArray(data) ? data : []))
      .catch(() => setDocumentation([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="mb-12">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">Documentation</h2>
      {loading ? (
        <div className="text-gray-500">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {documentation.length === 0 ? (
            <div className="text-gray-500">No documentation available.</div>
          ) : (
            documentation.map((doc) => (
              <div key={doc.id} className="bg-white shadow-sm rounded-lg p-6 flex flex-col justify-between h-full relative">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{doc.title || "Untitled"}</h3>
                  <p className="text-gray-600 mb-4">{doc.subtitle || ""}</p>
                </div>
                <button
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-colors duration-200 absolute bottom-4 right-4 font-medium"
                  onClick={() => window.open(`/support/documentation/${doc.id}`, "_blank")}
                >
                  Read More
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </section>
  );
};

export default DocumentationSection; 