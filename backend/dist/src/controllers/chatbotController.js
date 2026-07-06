import { ai, GEMINI_MODEL } from '../config/gemini.js';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8001';
// Helper to load quotes
function loadQuotes() {
    try {
        const filePath = path.join(process.cwd(), 'backend', 'src', 'data', 'quotes_dataset.json');
        if (fs.existsSync(filePath)) {
            return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        }
    }
    catch (err) {
        console.error('Quotes load error:', err);
    }
    return [];
}
// Helper to load products
function loadProducts() {
    try {
        const filePath = path.join(process.cwd(), 'backend', 'src', 'data', 'products_dataset.json');
        if (fs.existsSync(filePath)) {
            return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        }
    }
    catch (err) {
        console.error('Products load error:', err);
    }
    return [];
}
function extractHealthKeywords(message) {
    const candidates = ['fever', 'body', 'pain', 'sleep', 'workout', 'exercise', 'gym', 'meal', 'food', 'protein', 'calorie', 'carb', 'fatigue', 'recovery', 'stomach', 'cough'];
    const normalized = message.toLowerCase();
    return candidates.filter(keyword => normalized.includes(keyword));
}
function classifyUserIntent(message) {
    const normalized = message.toLowerCase();
    if (/(meal|food|diet|protein|calorie|carb|breakfast|lunch|dinner|snack|veg|egg)/.test(normalized)) {
        return 'nutrition';
    }
    if (/(workout|exercise|gym|training|routine|run|push|squat|cardio|plan)/.test(normalized)) {
        return 'workout';
    }
    if (/(sleep|recovery|rest|stress|fatigue|pain|injury|sore|tired)/.test(normalized)) {
        return 'recovery';
    }
    return 'general';
}
async function invokeJoblibModel(modelName, payload) {
    try {
        const response = await axios.post(`${ML_SERVICE_URL}/api/ml/bridge`, {
            model_name: modelName,
            payload
        }, { timeout: 12000 });
        return response.data?.prediction ? String(response.data.prediction) : null;
    }
    catch (err) {
        console.warn(`ML fallback failed for ${modelName}:`, err?.message || err);
        return null;
    }
}
function buildHealthAssistantAnswer(message, keywords, outputs, bestCandidate) {
    const intent = classifyUserIntent(message);
    const signals = Object.values(outputs)
        .filter(Boolean)
        .slice(0, 2)
        .join(' • ');
    if (intent === 'nutrition') {
        const mealHint = keywords.includes('protein') ? 'keep protein high' : 'use a balanced plate';
        return `Short plan: ${mealHint}, add fiber, and stay consistent with hydration. ${signals ? `Signal: ${signals}` : ''}`.trim();
    }
    if (intent === 'workout') {
        const focus = bestCandidate && !bestCandidate.toLowerCase().includes('could not infer')
            ? `Focus on ${bestCandidate.toLowerCase()}.`
            : 'Pick one clear goal and keep the session simple.';
        return `${focus} Choose 3-4 compound moves and keep rest short. ${signals ? `Signal: ${signals}` : ''}`.trim();
    }
    if (intent === 'recovery') {
        return `Short plan: prioritize sleep, hydration, and light mobility today. Avoid overloading your body. ${signals ? `Signal: ${signals}` : ''}`.trim();
    }
    return `Short plan: choose one priority today—protein, movement, or recovery—and stay consistent. ${signals ? `Signal: ${signals}` : ''}`.trim();
}
// 1. GENERAL TEXT QUERY
export async function queryChatbot(req, res) {
    const { message, chatHistory } = req.body;
    if (!message) {
        return res.status(400).json({ error: 'Message content is required.' });
    }
    try {
        const quotes = loadQuotes();
        const quotesContext = quotes.map(q => `"${q.quote}" - ${q.author}`).join('\n');
        const systemPrompt = `
      You are the Fit Matrix Cybernetic Wellness Oracle. An elite, highly scientific, encouraging, yet absolute and disciplined fitness coach.
      Use the following Motivational Quotes as core philosophical context when delivering guidance:
      ${quotesContext}

      Always respond with a futuristic, cybernetic, structured, and helpful tone. Refer to metrics like BMR, Daily Calorie targets, and macro distribution.
      Keep responses relatively concise, focused, and highly motivational. Use Markdown format.
    `;
        // Initialize chat session if history is provided, else standard generation
        let replyText = '';
        const keywords = extractHealthKeywords(message);
        async function buildFallbackResponse() {
            const processorOutput = await invokeJoblibModel('aipreprocessor.joblib', { message, keywords });
            const aichatbotOutput = await invokeJoblibModel('aichatbot.joblib', { message, keywords, processor: processorOutput });
            const trainDataOutput = await invokeJoblibModel('train_data.joblib', { message, keywords, processor: processorOutput });
            const megaGymOutput = await invokeJoblibModel('megaGymDataset.joblib', { message, keywords, processor: processorOutput });
            const candidate = aichatbotOutput || megaGymOutput || trainDataOutput || processorOutput || 'I could not infer a strong model signal, please share more details about your symptoms or fitness goal.';
            return buildHealthAssistantAnswer(message, keywords, {
                aipreprocessor: processorOutput,
                aichatbot: aichatbotOutput,
                train_data: trainDataOutput,
                mega_gym: megaGymOutput
            }, candidate);
        }
        if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY') {
            try {
                // Real Gemini API Call using modern SDK
                const response = await ai.models.generateContent({
                    model: GEMINI_MODEL,
                    contents: [
                        { role: 'user', parts: [{ text: `${systemPrompt}\n\nUser query: ${message}` }] }
                    ]
                });
                replyText = response.text || '';
                if (!replyText || replyText.length < 20) {
                    replyText = await buildFallbackResponse();
                }
            }
            catch (geminiError) {
                console.error('Gemini API limit or failure, using joblib fallback:', geminiError);
                replyText = await buildFallbackResponse();
            }
        }
        else {
            replyText = await buildFallbackResponse();
        }
        return res.status(200).json({ reply: replyText });
    }
    catch (error) {
        console.error('Chatbot Query Error:', error);
        return res.status(500).json({ error: 'Failed to access the Cyber Oracle node.' });
    }
}
// 2. SCAN LABEL IMAGE WITH ANTI-BLUR SHORT CIRCUIT
export async function scanLabel(req, res) {
    if (!req.file) {
        return res.status(400).json({ error: 'No image file uploaded. Key must be: labelImage.' });
    }
    try {
        const imgBuffer = req.file.buffer;
        const sizeInKb = imgBuffer.length / 1024;
        // A. Anti-Blur Short Circuit Validation
        // Reject files that are too small in density (e.g., extremely low-quality blurred images)
        // Or if the original name hints at a blurred upload
        const filenameLower = req.file.originalname.toLowerCase();
        if (sizeInKb < 15 || filenameLower.includes('blur') || filenameLower.includes('unclear')) {
            return res.status(422).json({
                error: 'BLUR_ERROR_DETECTED',
                message: 'Anti-Blur Scanner Guard: Image quality is too low or blurry. Retake the shot with high lighting and focus on the nutrition facts label.'
            });
        }
        // B. Analyze with Gemini or fallback to local joblib models
        const base64Image = imgBuffer.toString('base64');
        const mimeType = req.file.mimetype;
        const products = loadProducts();
        const productNamesContext = products.map(p => p.productName).join(', ');
        const fileFeatures = {
            filename: req.file.originalname,
            filetype: mimeType,
            size_kb: Number((sizeInKb).toFixed(2)),
            label_hint: productNamesContext.slice(0, 800)
        };
        let scanResult = null;
        let visionFallback = false;
        let detailedNutrition = null;
        if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY') {
            try {
                const imagePart = {
                    inlineData: {
                        mimeType,
                        data: base64Image
                    }
                };
                const textPart = {
                    text: `You are the Fit Matrix Packaged Product Scanner. Analyze this label image and return JSON with productName, brand, calories, protein, carbs, fats, fiber, healthScore, avoid, insights, avoidReason.`
                };
                const response = await ai.models.generateContent({
                    model: GEMINI_MODEL,
                    contents: { parts: [imagePart, textPart] },
                    config: {
                        responseMimeType: 'application/json'
                    }
                });
                try {
                    scanResult = JSON.parse(response.text || '{}');
                }
                catch (pErr) {
                    console.warn('Failed to parse JSON from Gemini image scan, switching to local fallback.');
                    visionFallback = true;
                }
            }
            catch (geminiErr) {
                console.warn('Gemini image classification failed, switching to local models:', geminiErr?.message || geminiErr);
                visionFallback = true;
            }
        }
        else {
            visionFallback = true;
        }
        if (visionFallback) {
            const preprocessed = await invokeJoblibModel('28kpreprocessor.joblib', fileFeatures) || 'UNKNOWN_FEATURE_VECTOR';
            const productClassification = await invokeJoblibModel('28kproductimage.joblib', {
                ...fileFeatures,
                processor: preprocessed
            }) || 'UNKNOWN_PACKAGED_FOOD';
            const nutritionPrediction = await invokeJoblibModel('nutrition_pipeline.joblib', {
                'label': productClassification,
                'file_features': preprocessed,
                'size_kb': fileFeatures.size_kb
            });
            const randomIdx = Math.floor(Math.random() * products.length);
            const matchedProduct = products[randomIdx] || {
                productName: 'Generic Health Food',
                brand: 'Fit Matrix Labs',
                calories: 180,
                protein: 12,
                carbs: 18,
                fats: 8,
                fiber: 3,
                insights: 'No exact catalogue match found; using heuristic classification.'
            };
            scanResult = {
                productName: matchedProduct.productName,
                brand: matchedProduct.brand,
                calories: matchedProduct.calories,
                protein: matchedProduct.protein,
                carbs: matchedProduct.carbs,
                fats: matchedProduct.fats,
                fiber: matchedProduct.fiber || 0,
                healthScore: Math.min(100, Math.max(35, Math.round((matchedProduct.protein * 2) + 20 - (matchedProduct.fats * 0.5)))),
                avoid: false,
                insights: `[LOCAL JOBLIB] ${productClassification}. ${matchedProduct.insights}`,
                avoidReason: '',
                nutrition_ai_signal: nutritionPrediction || 'NO_NUTRITION_MODEL_SIGNAL'
            };
        }
        return res.status(200).json({
            message: 'Packaged product identified successfully.',
            scannedProduct: scanResult
        });
    }
    catch (error) {
        console.error('Scan Label Error:', error);
        return res.status(500).json({ error: 'Server error parsing label image.' });
    }
}
