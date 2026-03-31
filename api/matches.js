import { getMatches } from '../lib/database.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const matches = await getMatches();
    res.json(matches);
  } catch (error) {
    console.error('Matches error:', error);
    res.status(500).json({ error: error.message });
  }
}