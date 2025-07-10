import { NextApiRequest, NextApiResponse } from 'next';
import { updateListing } from '../store';
import type { Listing } from '../../../../types';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

  const { id } = req.query;
  const { title, location, price } = req.body as Partial<Listing>;

  if (!title || !location || !price) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields'
    });
  }

  try {
    const listing = updateListing(id as string, { title, location, price: Number(price) });

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }

    res.status(200).json({
      success: true,
      data: listing
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update listing'
    });
  }
} 