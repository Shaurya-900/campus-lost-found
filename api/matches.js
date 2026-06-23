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
    const { getMatches } = await import('../lib/database.js');
    const matches = await getMatches();
    res.json(matches);
  } catch (error) {
    console.error('matches handler error:', error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
}
