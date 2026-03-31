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
  let totalChecks = 0;
  
  // Item type match (most important)
  if (lostTags.item_type && foundTags.item_type) {
    totalChecks++;
    const lostType = lostTags.item_type.toLowerCase();
    const foundType = foundTags.item_type.toLowerCase();
    if (lostType === foundType) {
      score += 40;
    } else if (lostType.includes(foundType) || foundType.includes(lostType)) {
      score += 20;
    }
  }
  
  // Color match
  if (lostTags.color && foundTags.color) {
    totalChecks++;
    const lostColor = lostTags.color.toLowerCase();
    const foundColor = foundTags.color.toLowerCase();
    if (lostColor === foundColor) {
      score += 25;
    } else if (lostColor.includes(foundColor) || foundColor.includes(lostColor)) {
      score += 15;
    }
  }
  
  // Material match
  if (lostTags.material && foundTags.material) {
    totalChecks++;
    const lostMat = lostTags.material.toLowerCase();
    const foundMat = foundTags.material.toLowerCase();
    if (lostMat === foundMat) {
      score += 15;
    } else if (lostMat.includes(foundMat) || foundMat.includes(lostMat)) {
      score += 8;
    }
  }
  
  // Brand match
  if (lostTags.brand && foundTags.brand) {
    totalChecks++;
    const lostBrand = lostTags.brand.toLowerCase();
    const foundBrand = foundTags.brand.toLowerCase();
    if (lostBrand === foundBrand) {
      score += 20;
    }
  }
  
  // Location proximity (bonus)
  if (lostItem.location === foundItem.location) {
    score += 10;
  }
  
  return Math.min(score, 100); // Cap at 100
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