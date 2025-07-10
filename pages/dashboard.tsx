import { GetServerSideProps } from 'next';
import { useState } from 'react';
import type { Listing } from '../types';

interface DashboardProps {
  listings?: Listing[];
  error?: {
    message: string;
    code?: number;
  };
}

interface EditModalProps {
  listing: Listing;
  onClose: () => void;
  onSave: (id: string, updates: Partial<Listing>) => Promise<void>;
}

function EditModal({ listing, onClose, onSave }: EditModalProps) {
  const [title, setTitle] = useState(listing?.title ?? '');
  const [location, setLocation] = useState(listing?.location ?? '');
  const [price, setPrice] = useState(listing?.price ?? 0);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listing?.id) {
      setError('Invalid listing data');
      return;
    }
    setError('');
    setIsSaving(true);

    try {
      await onSave(listing.id, { title, location, price });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Edit Listing</h2>
        {error && (
          <div className="mb-4 text-red-600 text-sm">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              placeholder="Title"
              required
            />
          </div>
          <div>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              placeholder="Location"
              required
            />
          </div>
          <div>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="w-full px-3 py-2 border rounded"
              placeholder="Price"
              required
              min="0"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<DashboardProps> = async ({ req }) => {
  const { authToken } = req.cookies;

  if (!authToken) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  try {
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const host = req.headers.host;
    const response = await fetch(`${protocol}://${host}/api/listings`);
    
    console.log('API Response Status:', response.status);
    
    if (response.status === 500) {
      return {
        props: {
          listings: [],
          error: {
            message: 'Internal Server Error',
            code: 500
          }
        }
      };
    }

    if (!response.ok) {
      return {
        props: {
          listings: [],
          error: {
            message: `API responded with status ${response.status}`,
            code: response.status
          }
        }
      };
    }

    const data = await response.json();
    
    console.log('API Response Data:', data);
    
    const listings = Array.isArray(data?.data) ? data.data :
                    Array.isArray(data?.listings) ? data.listings : [];

    console.log('Final Listings Array:', listings);

    return {
      props: {
        listings,
      },
    };
  } catch (error) {
    console.error('Error fetching listings:', error);
    return {
      props: {
        listings: [],
        error: {
          message: 'Failed to load listings. Please try again.',
          code: 0
        }
      }
    };
  }
};

export default function Dashboard({ listings: initialListings, error: initialError }: DashboardProps) {
  console.log('Initial listings type:', typeof initialListings);
  console.log('Initial listings isArray:', Array.isArray(initialListings));
  console.log('Initial listings value:', initialListings);

  const safeInitialListings = Array.isArray(initialListings) ? initialListings : [];
  const [listings, setListings] = useState(safeInitialListings);
  
  console.log('Current listings type:', typeof listings);
  console.log('Current listings isArray:', Array.isArray(listings));
  console.log('Current listings value:', listings);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [editingListing, setEditingListing] = useState<Listing | null>(null);

  const updateListingStatus = async (id: string, status: 'approved' | 'rejected') => {
    if (!id) return;
    setErrors(prev => ({ ...prev, [id]: '' }));
    setLoading(prev => ({ ...prev, [id]: true }));

    try {
      const response = await fetch(`/api/listings/${id}/${status}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      const updatedListing = await response.json();
      setListings(prev => {
        const currentListings = Array.isArray(prev) ? prev : [];
        return currentListings.map(listing => 
          listing?.id === id ? updatedListing : listing
        );
      });
    } catch (err) {
      setErrors(prev => ({
        ...prev,
        [id]: err instanceof Error ? err.message : 'Failed to update status'
      }));
    } finally {
      setLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleEdit = async (id: string, updates: Partial<Listing>) => {
    if (!id) return;
    try {
      const response = await fetch(`/api/listings/${id}/edit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error('Failed to update listing');
      }

      const updatedListing = await response.json();
      setListings(prev => {
        const currentListings = Array.isArray(prev) ? prev : [];
        return currentListings.map(listing => 
          listing?.id === id ? updatedListing : listing
        );
      });
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update listing');
    }
  };

  if (initialError) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
            <h2 className="text-red-800 font-semibold mb-2">Error</h2>
            <p className="text-red-700 mb-4">{initialError.message}</p>
            <div className="flex gap-4">
              <button
                onClick={() => window.location.reload()}
                className="bg-red-100 text-red-700 px-4 py-2 rounded-md hover:bg-red-200"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.href = '/login'}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200"
              >
                Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-2xl font-bold text-white mb-2">Car Listings</h1>
          <p className="text-gray-400 text-sm">Manage and update car rental submissions</p>
        </div>
        {!Array.isArray(listings) || listings.length === 0 ? (
          <div className="bg-gray-800 rounded-lg shadow-inner p-12 text-center">
            <p className="text-gray-500 text-lg">No listings available</p>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg shadow p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead>
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-sm font-semibold text-gray-400 uppercase tracking-wider bg-gray-800">Title</th>
                    <th scope="col" className="px-4 py-3 text-left text-sm font-semibold text-gray-400 uppercase tracking-wider bg-gray-800">Location</th>
                    <th scope="col" className="px-4 py-3 text-left text-sm font-semibold text-gray-400 uppercase tracking-wider bg-gray-800">Price</th>
                    <th scope="col" className="px-4 py-3 text-left text-sm font-semibold text-gray-400 uppercase tracking-wider bg-gray-800">Status</th>
                    <th scope="col" className="px-4 py-3 text-left text-sm font-semibold text-gray-400 uppercase tracking-wider bg-gray-800">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {Array.isArray(listings) && listings.map((listing) => (
                    <tr key={listing?.id ?? 'unknown'} className="hover:bg-gray-700 transition-colors duration-150">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-100">{listing?.title ?? 'Untitled'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{listing?.location ?? 'Unknown location'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">${listing?.price ?? 0}/day</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                          ${listing?.status === 'approved' ? 'bg-green-700 text-green-200' : ''}
                          ${listing?.status === 'pending' ? 'bg-yellow-700 text-yellow-200' : ''}
                          ${listing?.status === 'rejected' ? 'bg-red-700 text-red-200' : ''}`}>
                          {(listing?.status ?? 'unknown').charAt(0).toUpperCase() + (listing?.status ?? 'unknown').slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => listing?.id && updateListingStatus(listing.id, 'approved')}
                            disabled={loading[listing?.id ?? ''] || listing?.status === 'approved'}
                            className="text-green-400 hover:text-green-300 disabled:opacity-50 disabled:hover:text-green-400 font-medium cursor-pointer disabled:cursor-not-allowed transition-colors duration-150"
                          >
                            {loading[listing?.id ?? ''] ? 'Processing...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => listing?.id && updateListingStatus(listing.id, 'rejected')}
                            disabled={loading[listing?.id ?? ''] || listing?.status === 'rejected'}
                            className="text-red-400 hover:text-red-300 disabled:opacity-50 disabled:hover:text-red-400 font-medium cursor-pointer disabled:cursor-not-allowed transition-colors duration-150"
                          >
                            {loading[listing?.id ?? ''] ? 'Processing...' : 'Reject'}
                          </button>
                          <button
                            onClick={() => listing && setEditingListing(listing)}
                            disabled={loading[listing?.id ?? '']}
                            className="text-blue-400 hover:text-blue-300 disabled:opacity-50 disabled:hover:text-blue-400 font-medium cursor-pointer disabled:cursor-not-allowed transition-colors duration-150"
                          >
                            Edit
                          </button>
                        </div>
                        {errors[listing?.id ?? ''] && (
                          <div className="mt-2 text-sm text-red-400 font-medium">
                            {errors[listing?.id ?? '']}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      {editingListing && (
        <EditModal
          listing={editingListing}
          onClose={() => setEditingListing(null)}
          onSave={handleEdit}
        />
      )}
    </div>
  );
} 