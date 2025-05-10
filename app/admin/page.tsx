'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import AdminSidebar from '@/components/AdminSidebar';
import SearchBar from '@/components/SearchBar';
import CategoryDropdown from '../../components/CategoryDropdown';
import RefreshButton from '../../components/RefreshButton';

interface User {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'suspended' | 'banned';
  role?: 'admin' | 'user';
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  thumbnail: string;
  price_type: 'one_time' | 'subscription';
  currency: string;
  features: string[];
  assistant_id: string;
}

interface Bundle {
  id: string;
  name: string;
  description: string;
  image: string;
  product_ids: string[];
}

if (typeof window !== 'undefined') {
  console.log('Cookies at page load:', document.cookie);
  console.log('localStorage at page load:', window.localStorage);
}

export default function AdminPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const section = searchParams.get('section') || 'users';
  const { user, session, loading } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [error, setError] = useState('');
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingBundleId, setEditingBundleId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditBundleModalOpen, setIsEditBundleModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<{
    name: string;
    description: string;
    price: number;
    category: string;
    thumbnail: string;
    price_type: 'one_time' | 'subscription';
    currency: string;
    features: string;
    assistant_id: string;
  }>({
    name: '',
    description: '',
    price: 0,
    category: '',
    thumbnail: '',
    price_type: 'one_time',
    currency: 'USD',
    features: '',
    assistant_id: ''
  });
  const [editBundleForm, setEditBundleForm] = useState<{
    name: string;
    description: string;
    image: string;
    product_ids: string[];
  }>({
    name: '',
    description: '',
    image: '',
    product_ids: []
  });
  const [productCategorySearch, setProductCategorySearch] = useState('');
  const [bundleCategorySearch, setBundleCategorySearch] = useState('');
  const [selectedProductCategory, setSelectedProductCategory] = useState('');
  const [selectedBundleCategory, setSelectedBundleCategory] = useState('');

  console.log('AdminPage useAuth:', { user, session, loading });

  const handleUserStatusChange = async (userId: string, newStatus: 'active' | 'suspended' | 'banned') => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update user status');
      }

      // Update local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, status: newStatus } : user
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user status');
    }
  };

  const handleEditProduct = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      setEditingProductId(productId);
      setEditForm({
        name: product.name,
        description: product.description || '',
        price: product.price,
        category: product.category || '',
        thumbnail: product.thumbnail || '',
        price_type: product.price_type || 'one_time',
        currency: product.currency,
        features: Array.isArray(product.features) ? product.features.join(', ') : '',
        assistant_id: product.assistant_id || ''
      });
      setIsEditModalOpen(true);
    }
  };

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.name === 'price' ? Number(e.target.value) : e.target.value });
  };

  const handleSaveProduct = async (productId: string) => {
    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          ...editForm,
          features: editForm.features.split(',').map(f => f.trim())
        })
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data.error || 'Failed to update product');
      } else {
        // Refetch all products after successful update
        const productsRes = await fetch('/api/admin/products', {
          headers: {
            'Authorization': `Bearer ${session?.access_token}`
          }
        });
        if (productsRes.ok) {
          const productsData = await productsRes.json();
          setProducts(productsData);
        }
        setIsEditModalOpen(false);
      }
    } catch (err) {
      alert('Failed to update product');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete product');
      }
      // Refetch all products after successful deletion
      const productsRes = await fetch('/api/admin/products', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });
      if (productsRes.ok) {
        const productsData = await productsRes.json();
        setProducts(productsData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete product');
    }
  };

  const handleEditBundle = (bundleId: string) => {
    const bundle = bundles.find((b) => b.id === bundleId);
    if (bundle) {
      setEditingBundleId(bundleId);
      setEditBundleForm({
        name: bundle.name,
        description: bundle.description || '',
        image: bundle.image || '',
        product_ids: bundle.product_ids || []
      });
      setIsEditBundleModalOpen(true);
    }
  };

  const handleEditBundleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setEditBundleForm({ ...editBundleForm, [e.target.name]: e.target.value });
  };

  const handleSaveBundle = async (bundleId: string) => {
    try {
      const response = await fetch(`/api/admin/bundles/${bundleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(editBundleForm)
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data.error || 'Failed to update bundle');
      } else {
        // Refetch all bundles after successful update
        const bundlesRes = await fetch('/api/admin/bundles', {
          headers: {
            'Authorization': `Bearer ${session?.access_token}`
          }
        });
        if (bundlesRes.ok) {
          const bundlesData = await bundlesRes.json();
          setBundles(bundlesData);
        }
        setIsEditBundleModalOpen(false);
      }
    } catch (err) {
      alert('Failed to update bundle');
    }
  };

  const handleDeleteBundle = async (bundleId: string) => {
    try {
      const response = await fetch(`/api/admin/bundles/${bundleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete bundle');
      }
      // Refetch all bundles after successful deletion
      const bundlesRes = await fetch('/api/admin/bundles', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });
      if (bundlesRes.ok) {
        const bundlesData = await bundlesRes.json();
        setBundles(bundlesData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete bundle');
    }
  };

  useEffect(() => {
    if (loading) return;
    if (!session) {
      router.push('/auth/login');
      return;
    }
    if (user?.role !== 'admin') {
      router.push('/');
      return;
    }
    // Always fetch latest data
    const fetchAdminData = async () => {
      try {
        const accessToken = session?.access_token;
        const [usersRes, productsRes, bundlesRes] = await Promise.all([
          fetch('/api/admin/users', {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          }),
          fetch('/api/admin/products', {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          }),
          fetch('/api/admin/bundles', {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          })
        ]);
        if (!usersRes.ok || !productsRes.ok || !bundlesRes.ok) {
          throw new Error('Failed to fetch admin data');
        }
        const [usersData, productsData, bundlesData] = await Promise.all([
          usersRes.json(),
          productsRes.json(),
          bundlesRes.json()
        ]);
        setUsers(usersData);
        setProducts(productsData);
        setBundles(bundlesData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch admin data');
      }
    };
    fetchAdminData();
  }, [session, user, loading, router, error]);

  // Unique categories from products
  const productCategories = Array.from(new Set(products.map((p) => p.category))).filter(Boolean);

  // Filtered products and bundles by category
  const filteredProducts = products.filter(p =>
    (selectedProductCategory === '' || p.category === selectedProductCategory) &&
    (productCategorySearch.trim() === '' ||
      p.category.toLowerCase().includes(productCategorySearch.trim().toLowerCase()))
  );
  const filteredBundles = bundles.filter(b => {
    // Find if any product in the bundle matches the search and/or selected category
    if (selectedBundleCategory === '' && bundleCategorySearch.trim() === '') return true;
    return b.product_ids.some(pid => {
      const prod = products.find(p => p.id === pid);
      if (!prod) return false;
      const matchesCategory = selectedBundleCategory === '' || prod.category === selectedBundleCategory;
      const matchesSearch = bundleCategorySearch.trim() === '' || prod.category.toLowerCase().includes(bundleCategorySearch.trim().toLowerCase());
      return matchesCategory && matchesSearch;
    });
  });

  // Reset handlers
  const resetProductFilters = () => {
    setSelectedProductCategory('');
    setProductCategorySearch('');
  };
  const resetBundleFilters = () => {
    setSelectedBundleCategory('');
    setBundleCategorySearch('');
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl px-8 py-8 mx-auto">
          <h1 className="text-2xl font-bold mb-6 text-left">Admin Dashboard</h1>
          <div className="grid grid-cols-1 gap-6">
            {/* Users Section */}
            {section === 'users' && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4 text-left">Users</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 text-left">Name</th>
                        <th className="px-4 py-2 text-left">Email</th>
                        <th className="px-4 py-2 text-left">Status</th>
                        <th className="px-4 py-2 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id}>
                          <td className="px-4 py-2">{user.name}</td>
                          <td className="px-4 py-2">{user.email}</td>
                          <td className="px-4 py-2">{user.status}</td>
                          <td className="px-4 py-2">
                            <button
                              onClick={() => handleUserStatusChange(user.id, user.status === 'active' ? 'suspended' : 'active')}
                              className="text-blue-600 hover:text-blue-800 mr-2"
                            >
                              {user.status === 'active' ? 'Suspend' : 'Activate'}
                            </button>
                            <button
                              onClick={async () => {
                                const newRole = user.role === 'admin' ? 'user' : 'admin';
                                const response = await fetch(`/api/admin/users/${user.id}/role`, {
                                  method: 'PUT',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${session?.access_token}`
                                  },
                                  body: JSON.stringify({ role: newRole })
                                });
                                const data = await response.json();
                                if (!response.ok) {
                                  alert(data.error || 'Failed to update role');
                                } else {
                                  setUsers(users.map(u => u.id === user.id ? { ...u, role: newRole } : u));
                                }
                              }}
                              className="text-purple-600 hover:text-purple-800"
                            >
                              {user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {/* Products Section */}
            {section === 'products' && (
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-left">Products</h2>
                  <button
                    onClick={() => router.push('/admin/create-product')}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    + Add Product
                  </button>
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <CategoryDropdown
                    categories={productCategories}
                    selected={selectedProductCategory}
                    onSelect={setSelectedProductCategory}
                    className="max-w-xs"
                  />
                  <RefreshButton onClick={resetProductFilters} />
                </div>
                <div className="mb-4">
                  <SearchBar
                    value={productCategorySearch}
                    onChange={setProductCategorySearch}
                    onSearch={setProductCategorySearch}
                    placeholder="Search by category..."
                    className="max-w-xs"
                  />
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 text-left">Name</th>
                        <th className="px-4 py-2 text-left">Price</th>
                        <th className="px-4 py-2 text-left">Currency</th>
                        <th className="px-4 py-2 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((product) => (
                        <tr key={product.id}>
                          <td className="px-4 py-2">{product.name}</td>
                          <td className="px-4 py-2">{product.price}</td>
                          <td className="px-4 py-2">{product.currency}</td>
                          <td className="px-4 py-2">
                            <div className="flex flex-col space-y-1">
                              <button
                                onClick={() => handleEditProduct(product.id)}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(product.id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {/* Bundles Section */}
            {section === 'bundles' && (
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-left">Bundles</h2>
                  <button
                    onClick={() => router.push('/admin/create-bundles')}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    + Add Bundle
                  </button>
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <CategoryDropdown
                    categories={productCategories}
                    selected={selectedBundleCategory}
                    onSelect={setSelectedBundleCategory}
                    className="max-w-xs"
                  />
                  <RefreshButton onClick={resetBundleFilters} />
                </div>
                <div className="mb-4">
                  <SearchBar
                    value={bundleCategorySearch}
                    onChange={setBundleCategorySearch}
                    onSearch={setBundleCategorySearch}
                    placeholder="Search by category (of products in bundle)..."
                    className="max-w-xs"
                  />
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 text-left">Name</th>
                        <th className="px-4 py-2 text-left">Description</th>
                        <th className="px-4 py-2 text-left">Products</th>
                        <th className="px-4 py-2 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBundles.map((bundle) => (
                        <tr key={bundle.id}>
                          <td className="px-4 py-2">{bundle.name}</td>
                          <td className="px-4 py-2">{bundle.description}</td>
                          <td className="px-4 py-2">
                            {bundle.product_ids.length} products
                          </td>
                          <td className="px-4 py-2">
                            <button
                              onClick={() => handleEditBundle(bundle.id)}
                              className="text-blue-600 hover:text-blue-800 mr-2"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteBundle(bundle.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-xl w-full">
            <h2 className="text-xl font-bold mb-4">Edit Product</h2>
            <form onSubmit={(e) => { e.preventDefault(); handleSaveProduct(editingProductId!); }} className="space-y-4">
              <input name="name" value={editForm.name} onChange={handleEditFormChange} placeholder="Name" className="w-full border p-2" required />
              <textarea name="description" value={editForm.description} onChange={handleEditFormChange} placeholder="Description" className="w-full border p-2" required />
              <input name="price" value={editForm.price} onChange={handleEditFormChange} placeholder="Price (cents)" type="number" className="w-full border p-2" required />
              <input name="category" value={editForm.category} onChange={handleEditFormChange} placeholder="Category" className="w-full border p-2" required />
              <input name="thumbnail" value={editForm.thumbnail} onChange={handleEditFormChange} placeholder="Thumbnail URL" className="w-full border p-2" required />
              <select name="price_type" value={editForm.price_type} onChange={handleEditFormChange} className="w-full border p-2" required>
                <option value="one_time">One Time</option>
                <option value="subscription">Subscription</option>
              </select>
              <input name="currency" value={editForm.currency} onChange={handleEditFormChange} placeholder="Currency (USD)" className="w-full border p-2" required />
              <input name="features" value={editForm.features} onChange={handleEditFormChange} placeholder="Features (comma separated)" className="w-full border p-2" />
              <input name="assistant_id" value={editForm.assistant_id} onChange={handleEditFormChange} placeholder="Assistant ID" className="w-full border p-2" required />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 border rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditBundleModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-xl w-full">
            <h2 className="text-xl font-bold mb-4">Edit Bundle</h2>
            <form onSubmit={(e) => { e.preventDefault(); handleSaveBundle(editingBundleId!); }} className="space-y-4">
              <input
                name="name"
                value={editBundleForm.name}
                onChange={handleEditBundleFormChange}
                placeholder="Name"
                className="w-full border p-2"
                required
              />
              <textarea
                name="description"
                value={editBundleForm.description}
                onChange={handleEditBundleFormChange}
                placeholder="Description"
                className="w-full border p-2"
                required
              />
              <input
                name="image"
                value={editBundleForm.image}
                onChange={handleEditBundleFormChange}
                placeholder="Image URL"
                className="w-full border p-2"
                required
              />
              <div className="space-y-2">
                <label className="block font-medium">Products</label>
                {products.map((product) => (
                  <label key={product.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={editBundleForm.product_ids.includes(product.id)}
                      onChange={(e) => {
                        const newProductIds = e.target.checked
                          ? [...editBundleForm.product_ids, product.id]
                          : editBundleForm.product_ids.filter(id => id !== product.id);
                        setEditBundleForm({ ...editBundleForm, product_ids: newProductIds });
                      }}
                      className="rounded"
                    />
                    <span>{product.name}</span>
                  </label>
                ))}
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditBundleModalOpen(false)}
                  className="px-4 py-2 border rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 