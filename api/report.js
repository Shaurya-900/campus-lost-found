// api/report.js
import { insertItem, getItemsByType, getItemImage, insertMatch } from '../lib/database.js';
import { analyzeImage } from '../lib/gemini.js';
import { findMatches } from '../lib/matcher.js';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type, image, location, note } = req.body;
    
    if (!type || !image || !location) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    if (type !== 'lost' && type !== 'found') {
      return res.status(400).json({ error: 'Type must be "lost" or "found"' });
    }
    
    console.log(`Processing ${type} item at ${location}...`);
    
    const aiTags = await analyzeImage(image);
    console.log('AI Tags:', aiTags);
    
    const itemId = await insertItem(type, image, location, note, aiTags);
    
    const oppositeType = type === 'lost' ? 'found' : 'lost';
    const oppositeItems = await getItemsByType(oppositeType);
    
    const newItem = {
      id: itemId,
      type,
      image_base64: image,
      location,
      note,
      ai_tags: JSON.stringify(aiTags)
    };
    
    const matches = await findMatches(newItem, oppositeItems, 50);
    
    console.log(`Found ${matches.length} potential matches`);
    
    for (const match of matches) {
      if (type === 'lost') {
        await insertMatch(itemId, match.item.id, match.confidence);
      } else {
        await insertMatch(match.item.id, itemId, match.confidence);
      }
    }

    // getItemsByType omits image_base64 for speed; hydrate it only for the few
    // matches we return, since the frontend renders their thumbnails.
    const topMatches = matches.slice(0, 3);
    const hydratedMatches = await Promise.all(topMatches.map(async (match) => {
      const image_base64 = await getItemImage(match.item.id);
      return { ...match, item: { ...match.item, image_base64 } };
    }));

    res.json({
      success: true,
      itemId,
      aiTags,
      matchesFound: matches.length,
      matches: hydratedMatches
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}