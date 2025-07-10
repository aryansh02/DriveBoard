import { NextApiRequest, NextApiResponse } from 'next';
import { getListings } from './listings/store';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

  try {
    const listings = getListings();
    res.status(200).json({
      success: true,
      data: listings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch listings'
    });
  }
} 