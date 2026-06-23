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

  // temporary debug
  const dbUrl = process.env.TURSO_CONNECTION_URL;
  const dbToken = process.env.TURSO_AUTH_TOKEN;
  console.log('TURSO_CONNECTION_URL:', dbUrl ? dbUrl.slice(0, 40) : 'UNDEFINED');
  console.log('TURSO_AUTH_TOKEN:', dbToken ? 'set' : 'UNDEFINED');

  try {
    const { getMatches } = await import('../lib/database.js');
    const matches = await getMatches();
    res.json(matches);
  } catch (error) {
    console.error('matches handler error:', error);
    res.status(500).json({
      error: error.message,
      dbUrl: dbUrl ? dbUrl.slice(0, 40) : 'UNDEFINED',
      dbTokenSet: !!dbToken
    });
  }
}
