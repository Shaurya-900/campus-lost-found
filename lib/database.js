import { createClient } from '@libsql/client/http';
import dotenv from 'dotenv';

dotenv.config();

const client = createClient({
  url: process.env.TURSO_CONNECTION_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
});

export async function insertItem(type, imageBase64, location, note, aiTags) {
  const result = await client.execute({
    sql: 'INSERT INTO items (type, image_base64, location, note, ai_tags, created_at) VALUES (?, ?, ?, ?, ?, ?) RETURNING id',
    args: [type, imageBase64, location, note, JSON.stringify(aiTags), new Date().toISOString()]
  });
  return Number(result.lastInsertRowid);
}

export async function getItemById(id) {
  const result = await client.execute({
    sql: 'SELECT * FROM items WHERE id = ?',
    args: [id]
  });
  return result.rows.map(row => ({
    id: row.id,
    type: row.type,
    image_base64: row.image_base64,
    location: row.location,
    note: row.note,
    ai_tags: row.ai_tags,
    created_at: row.created_at
  }))[0]; 
}

// Lightweight: omit image_base64 on purpose. Matching only needs ai_tags +
// location, and SELECT *-ing every row's base64 image makes the HTTP response
// balloon and time out the function as the table grows. Callers that need an
// image should fetch it per-id via getItemById.
export async function getItemsByType(type) {
  const result = await client.execute({
    sql: 'SELECT id, type, location, note, ai_tags, created_at FROM items WHERE type = ?',
    args: [type]
  });
  return result.rows.map(row => ({
    id: row.id,
    type: row.type,
    location: row.location,
    note: row.note,
    ai_tags: row.ai_tags,
    created_at: row.created_at
  }));
}


export async function getAllItems() {
  const result = await client.execute({
    sql: 'SELECT * FROM items ORDER BY created_at DESC',
    args: []
  });
  return result.rows.map(row => ({
    id: row.id,
    type: row.type,
    image_base64: row.image_base64,
    location: row.location,
    note: row.note,
    ai_tags: row.ai_tags,
    created_at: row.created_at
  }))
}

// Fetch a single item's image with a hard timeout. The Turso HTTP client can
// stall on larger base64 image rows (observed at ~80KB+); rather than let that
// hang the whole request until the function times out (504), we bail out and
// return null so callers degrade to "no image" instead of failing entirely.
export async function getItemImage(id, timeoutMs = 5000) {
  try {
    const result = await Promise.race([
      client.execute({ sql: 'SELECT image_base64 FROM items WHERE id = ?', args: [id] }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('image fetch timeout')), timeoutMs))
    ]);
    return result.rows[0]?.image_base64 ?? null;
  } catch (error) {
    console.warn(`[db] image fetch for item ${id} failed/timed out:`, error.message);
    return null;
  }
}

export async function insertMatch(lostId, foundId, confidence) {
  const result = await client.execute({
    sql: 'INSERT INTO matches (lost_id, found_id, confidence, created_at) VALUES (?, ?, ?, ?) RETURNING id',
    args: [lostId, foundId, confidence, new Date().toISOString()]
  });
  return Number(result.lastInsertRowid);
}

export async function getMatches() {
  try {
    // Metadata + tags + locations only. Never bulk-select image_base64 here — a
    // JOIN that returns many base64 images makes the response balloon and hangs
    // the Turso HTTP client (the function then times out). Images are fetched
    // per-id below, where single-row selects stay fast.
    const result = await client.execute({
      sql: `SELECT
              m.id, m.lost_id, m.found_id, m.confidence, m.created_at,
              li.ai_tags as lost_tags, li.location as lost_location,
              fi.ai_tags as found_tags, fi.location as found_location
            FROM matches m
            LEFT JOIN items li ON m.lost_id = li.id
            LEFT JOIN items fi ON m.found_id = fi.id
            ORDER BY m.created_at DESC
            LIMIT 50`,
      args: []
    });

    if (!result || !result.rows) {
      return [];
    }

    // Fetch each referenced item's image individually, in parallel.
    const ids = [...new Set(result.rows.flatMap(r => [r.lost_id, r.found_id]).filter(Boolean))];
    const imageById = new Map();
    await Promise.all(ids.map(async (id) => {
      imageById.set(id, await getItemImage(id));
    }));

    return result.rows.map(row => ({
      id: row.id,
      lost_id: row.lost_id,
      found_id: row.found_id,
      confidence: row.confidence,
      created_at: row.created_at,
      lost_image: imageById.get(row.lost_id) ?? null,
      lost_tags: row.lost_tags,
      lost_location: row.lost_location,
      found_image: imageById.get(row.found_id) ?? null,
      found_tags: row.found_tags,
      found_location: row.found_location
    }));
  } catch (error) {
    console.error('getMatches error:', error);
    return [];
  }
}