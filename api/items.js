import { getAllItems } from '../lib/database.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const items = await getAllItems();
    res.json(items);
  } catch (error) {
    console.error('Items error:', error);
    res.status(500).json({ error: error.message });
  }
}