import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'database.json');

function readDB() {
  if (!fs.existsSync(DB_FILE)) {
    return { items: [], matches: [] };
  }
  const data = fs.readFileSync(DB_FILE, 'utf-8');
  return JSON.parse(data);
}

function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

export function insertItem(type, imageBase64, location, note, aiTags) {
  const db = readDB();
  const id = db.items.length + 1;
  
  const item = {
    id,
    type,
    image_base64: imageBase64,
    location,
    note,
    ai_tags: JSON.stringify(aiTags),
    item_type: aiTags.item_type || '',
    color: aiTags.color || '',
    material: aiTags.material || '',
    condition: aiTags.condition || '',
    created_at: new Date().toISOString()
  };
  
  db.items.push(item);
  writeDB(db);
  
  return id;
}

export function getItemById(id) {
  const db = readDB();
  return db.items.find(item => item.id === id);
}

export function getItemsByType(type) {
  const db = readDB();
  return db.items.filter(item => item.type === type);
}

export function getAllItems() {
  const db = readDB();
  return db.items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

export function insertMatch(lostId, foundId, confidence) {
  const db = readDB();
  const id = db.matches.length + 1;
  
  const match = {
    id,
    lost_id: lostId,
    found_id: foundId,
    confidence,
    created_at: new Date().toISOString()
  };
  
  db.matches.push(match);
  writeDB(db);
  
  return id;
}

export function getMatches() {
  const db = readDB();
  
  return db.matches.map(match => {
    const lostItem = db.items.find(i => i.id === match.lost_id);
    const foundItem = db.items.find(i => i.id === match.found_id);
    
    return {
      ...match,
      lost_image: lostItem?.image_base64,
      lost_tags: lostItem?.ai_tags,
      lost_location: lostItem?.location,
      found_image: foundItem?.image_base64,
      found_tags: foundItem?.ai_tags,
      found_location: foundItem?.location
    };
  }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}