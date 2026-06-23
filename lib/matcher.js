// Words that carry no matching signal (filler, or Gemini's "couldn't tell" value).
const STOPWORDS = new Set(['unknown', 'and', 'the', 'with', 'various', 'multi', 'colored', 'multicolored', 'assorted', 'assortment']);

function tokens(value) {
  return (typeof value === 'string' ? value : '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(w => w.length > 2 && !STOPWORDS.has(w));
}

// Jaccard overlap of the two word sets (0..1). Robust to Gemini's verbose,
// non-deterministic phrasing — "assortment of pastries and donuts" vs
// "assorted pastries and donuts" still overlaps strongly, where exact/substring
// matching scored zero.
function wordOverlap(a, b) {
  const A = new Set(tokens(a));
  const B = new Set(tokens(b));
  if (A.size === 0 || B.size === 0) return 0; // no usable info on one side
  let inter = 0;
  for (const w of A) if (B.has(w)) inter++;
  return inter / (A.size + B.size - inter);
}

// True only when the value carries real information (not blank / "unknown").
const hasInfo = v => typeof v === 'string' && v.trim() !== '' && v.trim().toLowerCase() !== 'unknown';

export function calculateMatchScore(lostItem, foundItem) {
  let lostTags = {};
  let foundTags = {};
  try {
    lostTags = typeof lostItem.ai_tags === 'string' ? JSON.parse(lostItem.ai_tags) : (lostItem.ai_tags || {});
  } catch (e) {
    console.warn('Failed to parse lostItem.ai_tags, using empty tags:', e);
    lostTags = {};
  }
  try {
    foundTags = typeof foundItem.ai_tags === 'string' ? JSON.parse(foundItem.ai_tags) : (foundItem.ai_tags || {});
  } catch (e) {
    console.warn('Failed to parse foundItem.ai_tags, using empty tags:', e);
    foundTags = {};
  }

  let score = 0;

  // Weighted word-overlap on the descriptive fields. wordOverlap returns 0 when
  // either side is blank/"unknown", so no-info tags neither match nor falsely match.
  score += wordOverlap(lostTags.item_type, foundTags.item_type) * 45;
  score += wordOverlap(lostTags.color, foundTags.color) * 25;
  score += wordOverlap(lostTags.material, foundTags.material) * 15;

  // Brand: exact match only, and only when both sides actually name a brand.
  if (hasInfo(lostTags.brand) && hasInfo(foundTags.brand) &&
      lostTags.brand.trim().toLowerCase() === foundTags.brand.trim().toLowerCase()) {
    score += 15;
  }

  // Same location is a small corroborating bonus.
  if (lostItem.location && foundItem.location && lostItem.location === foundItem.location) {
    score += 10;
  }

  return Math.round(Math.min(score, 100)); // Cap at 100
}

export function findMatches(newItem, existingItems, threshold = 50) {
  const matches = [];
  
  for (const existing of existingItems) {
    const score = calculateMatchScore(newItem, existing);
    if (score >= threshold) {
      matches.push({
        item: existing,
        confidence: score
      });
    }
  }
  
  // Sort by confidence descending
  matches.sort((a, b) => b.confidence - a.confidence);
  
  return matches;
}