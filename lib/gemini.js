import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function analyzeImage(imageBase64) {
  // Temporary: return empty tags to avoid Gemini timeout
  // TODO: Move Gemini to background job or use faster API
  return {
    item_type: 'unknown',
    color: 'unknown',
    material: 'unknown',
    condition: 'unknown',
    distinctive_features: 'unknown',
    brand: 'unknown',
    context: 'unknown'
  };
}