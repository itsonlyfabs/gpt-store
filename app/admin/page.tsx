'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface User {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'suspended' | 'banned';
}

interface Product {
  id: string;
  name: string;
  price: number;
  currency: string;
}

if (typeof window !== 'undefined') {
  console.log('Cookies at page load:', document.cookie);
  console.log('localStorage at page load:', window.localStorage);
}

export default function AdminPage() {
  const router = useRouter();
  const { user, session, loading } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState('');

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
    // TODO: Implement product editing
    console.log('Edit product:', productId);
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
        throw new Error('Failed to delete product');
      }

      // Update local state
      setProducts(products.filter(product => product.id !== productId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete product');
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

    // Only fetch if not already fetched and no error
    if (users.length === 0 && products.length === 0 && !error) {
      const fetchAdminData = async () => {
        try {
          const accessToken = session?.access_token;
          const [usersRes, productsRes] = await Promise.all([
            fetch('/api/admin/users', {
              headers: {
                'Authorization': `Bearer ${accessToken}`
              }
            }),
            fetch('/api/products', {
              headers: {
                'Authorization': `Bearer ${accessToken}`
              }
            })
          ]);

          if (!usersRes.ok || !productsRes.ok) {
            throw new Error('Failed to fetch admin data');
          }

          const [usersData, productsData] = await Promise.all([
            usersRes.json(),
            productsRes.json()
          ]);

          setUsers(usersData);
          setProducts(productsData);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to fetch admin data');
        }
      };

      fetchAdminData();
    }
  }, [session, user, loading, router, users.length, products.length, error]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Users Section */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Users</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Email</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Actions</th>
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
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {user.status === 'active' ? 'Suspend' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Products Section */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Products</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Price</th>
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td className="px-4 py-2">{product.name}</td>
                    <td className="px-4 py-2">{product.price} {product.currency}</td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => handleEditProduct(product.id)}
                        className="text-blue-600 hover:text-blue-800 mr-2"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
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
      </div>
    </div>
  );
} 