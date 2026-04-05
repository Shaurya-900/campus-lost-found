import { createClient } from '@libsql/client';
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

export async function getItemsByType(type) {
  const result = await client.execute({
    sql: ' SELECT * FROM items WHERE type= ?',
    args: [type]
  });
  return result.rows.map(row => ({
    id: row.id,
    type: row.type,
    image_base64: row.image_base64,
    location: row.location,
    note: row.note,
    ai_tags: row.ai_tags,
    created_at: row.created_at
  }));
}


export async function getAllItems() {
  const result = await client.execute({
    sql: 'SELECT * FROM items ORDER BY created_at DESC'
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

export async function insertMatch(lostId, foundId, confidence) {
  const result = await client.execute({
    sql: 'INSERT INTO matches (lost_id, found_id, confidence, created_at) VALUES (?, ?, ?, ?) RETURNING id',
    args: [lostId, foundId, confidence, new Date().toISOString()]
  });
  return Number(result.lastInsertRowid);
}

export async function getMatches() {
  try {
    console.log('Executing getMatches query...');
    const result = await client.execute({
      sql: `SELECT 
              m.id, m.lost_id, m.found_id, m.confidence, m.created_at,
              li.image_base64 as lost_image, li.ai_tags as lost_tags, li.location as lost_location,
              fi.image_base64 as found_image, fi.ai_tags as found_tags, fi.location as found_location
            FROM matches m
            LEFT JOIN items li ON m.lost_id = li.id
            LEFT JOIN items fi ON m.found_id = fi.id
            ORDER BY m.created_at DESC`
    });
    
    console.log('Query result:', result);
    console.log('Result rows:', result?.rows);
    
    if (!result || !result.rows) {
      console.log('No rows returned');
      return [];
    }
    
    console.log('Mapping rows...');
    const mapped = result.rows.map(row => ({
      id: row.id,
      lost_id: row.lost_id,
      found_id: row.found_id,
      confidence: row.confidence,
      created_at: row.created_at,
      lost_image: row.lost_image,
      lost_tags: row.lost_tags,
      lost_location: row.lost_location,
      found_image: row.found_image,
      found_tags: row.found_tags,
      found_location: row.found_location
    }));
    
    console.log('Mapped matches:', mapped);
    return mapped;
  } catch (error) {
    console.error('getMatches error:', error);
    return [];
  }
}