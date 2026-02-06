import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { insertItem, getItemsByType, insertMatch, getMatches, getAllItems } from './database.js';
import { analyzeImage } from './gemini.js';
import { findMatches } from './matcher.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://localhost:3000'
}));
app.use(express.json({ limit: '50mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Report item (lost or found)
app.post('/api/report', async (req, res) => {
  try {
    const { type, image, location, note } = req.body;
    
    if (!type || !image || !location) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    if (type !== 'lost' && type !== 'found') {
      return res.status(400).json({ error: 'Type must be "lost" or "found"' });
    }
    
    console.log(`Processing ${type} item at ${location}...`);
    
    // Analyze image with Gemini
    const aiTags = await analyzeImage(image);
    console.log('AI Tags:', aiTags);
    
    // Insert into database
    const itemId = insertItem(type, image, location, note, aiTags);
    
    // Find matches
    const oppositeType = type === 'lost' ? 'found' : 'lost';
    const oppositeItems = getItemsByType(oppositeType);
    
    const newItem = {
      id: itemId,
      type,
      image_base64: image,
      location,
      note,
      ai_tags: JSON.stringify(aiTags)
    };
    
    const matches = findMatches(newItem, oppositeItems, 50);
    
    console.log(`Found ${matches.length} potential matches`);
    
    // Store matches in database
    for (const match of matches) {
      if (type === 'lost') {
        insertMatch(itemId, match.item.id, match.confidence);
      } else {
        insertMatch(match.item.id, itemId, match.confidence);
      }
    }
    
    res.json({
      success: true,
      itemId,
      aiTags,
      matchesFound: matches.length,
      matches: matches.slice(0, 3) // Return top 3 matches
    });
    
  } catch (error) {
    console.error('Report error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all matches
app.get('/api/matches', (req, res) => {
  try {
    const matches = getMatches();
    res.json(matches);
  } catch (error) {
    console.error('Matches error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all items
app.get('/api/items', (req, res) => {
  try {
    const items = getAllItems();
    res.json(items);
  } catch (error) {
    console.error('Items error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});