import { getMatches } from '../lib/database.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const matches = await getMatches();
    res.json(matches);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}
