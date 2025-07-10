import type { Listing } from '../../../types';

const store: { listings: Listing[] } = {
  listings: [
    {
      id: '1',
      title: 'Honda City',
      location: 'Mumbai, India',
      price: 80,
      status: 'approved'
    },
    {
      id: '2',
      title: 'Toyota Fortuner',
      location: 'Delhi, India',
      price: 120,
      status: 'pending'
    },
    {
      id: '3',
      title: 'Tesla Model S',
      location: 'Los Angeles, USA',
      price: 300,
      status: 'rejected'
    },
    {
      id: '4',
      title: 'Range Rover Discovery',
      location: 'Dubai, UAE',
      price: 350,
      status: 'approved'
    },
    {
      id: '5',
      title: 'Hyundai Creta',
      location: 'Bangalore, India',
      price: 100,
      status: 'pending'
    },
    {
      id: '6',
      title: 'Ford Mustang GT',
      location: 'New York, USA',
      price: 250,
      status: 'approved'
    }
  ]
};

export function getListing(id: string): Listing | undefined {
  return store.listings.find(listing => listing.id === id);
}

export function updateListing(id: string, updates: Partial<Listing>): Listing | undefined {
  const index = store.listings.findIndex(listing => listing.id === id);
  if (index === -1) return undefined;

  store.listings[index] = { ...store.listings[index], ...updates };
  return store.listings[index];
}

export function getListings(): Listing[] {
  return store.listings;
}