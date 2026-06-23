import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Current default. gemini-2.0-flash was retired June 1 2026 — never fall back to it.
const DEFAULT_MODEL = 'gemini-2.5-flash';

// Schema keys, used to build a consistent "couldn't determine" fallback so the
// API never returns blank strings (which render as empty tags in the UI).
const TAG_KEYS = ['item_type', 'color', 'material', 'condition', 'distinctive_features', 'brand', 'context'];
const unknownTags = () => Object.fromEntries(TAG_KEYS.map(k => [k, 'unknown']));

export async function analyzeImage(imageBase64) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      console.warn('[gemini] GEMINI_API_KEY not set — skipping call, returning unknown tags');
      return unknownTags();
    }
    const selectedModel = process.env.GEMINI_MODEL || DEFAULT_MODEL;
    if (!process.env.GEMINI_MODEL) {
      console.warn('[gemini] GEMINI_MODEL not set — using default model:', selectedModel);
    }
    const model = genAI.getGenerativeModel({ model: selectedModel });

    const prompt = `You are an AI assistant helping with a campus lost and found system.
Analyze the image and return ONLY valid JSON with the exact keys below. Do not add any explanation, markdown, or surrounding text.

Schema:
{
  "item_type": "specific item name, or \"unknown\" if not identifiable",
  "color": "primary color(s) or \"unknown\"",
  "material": "material type or \"unknown\"",
  "condition": "condition or \"unknown\"",
  "distinctive_features": "comma-separated list or \"unknown\"",
  "brand": "brand name if visible or \"unknown\"",
  "context": "additional context from the image or \"unknown\""
}

Example response exactly as JSON:
{
  "item_type": "water bottle",
  "color": "blue",
  "material": "plastic",
  "condition": "used",
  "distinctive_features": "white sticker with initials",
  "brand": "Contigo",
  "context": "on a library table near a laptop"
}

Be concise and specific. If you cannot determine a field, set it to \"unknown\`. Return only the JSON object.`;

    // Detect mime type from data URL if present, fallback to jpeg
    let mimeType = 'image/jpeg';
    const dataUrlMatch = typeof imageBase64 === 'string' && imageBase64.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/);
    if (dataUrlMatch) {
      mimeType = dataUrlMatch[1];
    }
    const imageData = (typeof imageBase64 === 'string' && imageBase64.includes(',')) ? imageBase64.split(',')[1] : imageBase64;

    const imagePart = {
      inlineData: {
        data: imageData,
        mimeType
      }
    };

    const result = await model.generateContent([prompt, imagePart]);

    // Read textual response (SDKs vary; be verbose in logs so failures are diagnosable)
    let text = '';
    try {
      const response = await result.response;
      text = await response.text();
    } catch (readErr) {
      console.error('[gemini] could not read response.text():', readErr?.message || readErr);
    }

    // TEMP DIAGNOSTIC: log the raw model output so Vercel runtime logs reveal exactly
    // what Gemini returned (model/auth errors surface in the catch; this covers the
    // success-but-unparseable case). Truncated to keep logs readable.
    console.log('[gemini] model=%s raw response: %s', selectedModel, JSON.stringify((text || '').slice(0, 1000)));

    const parsed = extractTags(text);
    if (parsed) return parsed;

    console.error('[gemini] response was not parseable JSON — returning unknown tags');
    return unknownTags();
  } catch (error) {
    // Surface the distinguishing details (model 404 vs auth 401/403 vs other) in logs.
    console.error('[gemini] API error: name=%s status=%s message=%s',
      error?.name, error?.status ?? error?.statusText, error?.message || error);
    // Do not throw — return a safe fallback so the form submission still succeeds.
    return unknownTags();
  }
}

// Pull a tag object out of a model response that may be wrapped in ```json fences,
// bare ``` fences, or surrounded by prose. Returns null if no valid object is found.
function extractTags(text) {
  if (!text) return null;
  const candidates = [];

  // Prefer a fenced block if present (```json ... ``` or ``` ... ```)
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) candidates.push(fenced[1]);

  // Fall back to the first balanced-looking {...} block in the raw text.
  const brace = text.match(/\{[\s\S]*\}/);
  if (brace) candidates.push(brace[0]);

  candidates.push(text); // last resort: try the whole thing

  for (const c of candidates) {
    try {
      const obj = JSON.parse(c.trim());
      if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
        // Normalize: ensure all schema keys exist; blank/missing -> "unknown"
        return Object.fromEntries(TAG_KEYS.map(k => {
          const v = obj[k];
          return [k, v == null || v === '' ? 'unknown' : v];
        }));
      }
    } catch {
      // try next candidate
    }
  }
  return null;
}