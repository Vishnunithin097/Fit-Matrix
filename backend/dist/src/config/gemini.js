import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();
// Ensure Gemini API key is loaded
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.warn('⚠️ GEMINI_API_KEY environment variable is not defined. AI Chatbot functionality will operate in off-grid mock fallback mode.');
}
export const ai = new GoogleGenAI({
    apiKey: apiKey || 'MOCK_GEMINI_API_KEY',
    httpOptions: {
        headers: {
            'User-Agent': 'aistudio-build',
        }
    }
});
export const GEMINI_MODEL = 'gemini-3.5-flash';
export default ai;
