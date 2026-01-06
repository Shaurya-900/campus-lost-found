import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function analyzeImage(imageBase64) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      console.warn('GEMINI_API_KEY not set — skipping Gemini call and returning empty tags fallback');
      return {
        item_type: '',
        color: '',
        material: '',
        condition: '',
        distinctive_features: '',
        brand: '',
        context: ''
      };
    }
    const selectedModel = process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp';
    if (!process.env.GEMINI_MODEL) {
      console.warn('GEMINI_MODEL not set — using default model:', selectedModel);
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

    // Try to read textual response (SDKs vary; be verbose in logs)
    let text = '';
    try {
      const response = await result.response;
      text = await response.text();
    } catch (readErr) {
      console.warn('Could not read response.text() from Gemini result:', readErr);
      // Attempt to string-coerce result if possible
      try {
        text = String(result);
      } catch (strErr) {
        console.warn('Could not stringify Gemini result:', strErr);
      }
    }

    // Extract JSON from response text
    let jsonText = (text || '').trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }

    try {
      const parsed = JSON.parse(jsonText || '{}');

      // If parsed object has all empty or unknown values, do a single retry with a stricter follow-up prompt
      const isEmpty = Object.values(parsed).every(v => v === '' || v === undefined || v === null || v === '');
      if (isEmpty) {
        console.warn('Gemini returned empty tags; retrying once with a follow-up prompt');
        const followup = `Please re-check the image and return the same JSON schema. If you cannot identify a value, write \"unknown\" (not empty). Return ONLY the JSON.`;
        try {
          const retryResult = await model.generateContent([followup, imagePart]);
          let retryText = '';
          try {
            retryText = await retryResult.response.text();
          } catch (e) {
            retryText = String(retryResult || '');
          }
          let retryJson = retryText.trim();
          if (retryJson.startsWith('```json')) {
            retryJson = retryJson.replace(/```json\n?/g, '').replace(/```\n?/g, '');
          }
          const retryParsed = JSON.parse(retryJson || '{}');
          return retryParsed;
        } catch (retryErr) {
          console.warn('Retry to Gemini failed:', retryErr);
        }
      }

      return parsed;
    } catch (parseErr) {
      console.error('Failed to parse JSON from Gemini response. Raw response below:');
      console.error(text);
      console.error('JSON parse error:', parseErr);
      // Return a safe empty-tags fallback
      return {
        item_type: '',
        color: '',
        material: '',
        condition: '',
        distinctive_features: '',
        brand: '',
        context: ''
      };
    }
  } catch (error) {
    console.error('Gemini API error:', error);
    // Do not throw — return a safe empty-tags fallback so the server can continue.
    return {
      item_type: '',
      color: '',
      material: '',
      condition: '',
      distinctive_features: '',
      brand: '',
      context: ''
    };
  }
}