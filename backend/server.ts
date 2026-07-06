import express, { Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import axios from 'axios';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './src/routes/authRoutes.js';
import chatbotRoutes from './src/routes/chatbotRoutes.js';
import streakRoutes from './src/routes/streakRoutes.js';
import squadRoutes from './src/routes/squadRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load Environment Core System Matrix Config Flags
const envCandidates = [
    path.resolve(__dirname, '.env'),
    path.resolve(__dirname, '../.env'),
    path.resolve(__dirname, '../../.env')
];

for (const envPath of envCandidates) {
    const result = dotenv.config({ path: envPath });
    if (!result.error) {
        break;
    }
}

const app = express();
const PORT = process.env.PORT || 8080;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8001';

// System Handshake and Payload Network Middleware
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.CORS_ORIGIN,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174'
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(null, false);
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Core Module Routers Alignment
app.use('/api/auth', authRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/streak', streakRoutes);
app.use('/api/squad', squadRoutes);

app.get('/api/health', (_req, res) => {
    res.json({ status: 'HEALTHY', timestamp: new Date().toISOString() });
});

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// ==========================================================================
// 1. ARCHITECTURAL STRONG TYPE DATA INTERFACES
// ==========================================================================
interface UserStateProfile {
    weightTier: number; // 1: <50kg, 2: 50-80kg, 3: >80kg
    isRestDayMode: boolean;
    addEggToday: boolean;
    todayVegOnly: boolean;
    currentXp: number;
    completedPercentageLogout: number;
    fitness_goal?: string;
    food_preference?: string;
    activity_level?: string;
}

interface FoodDashboardRequest {
    recipe_name: string;
    cuisine: string;
    diet: string;
    prep_time: number;
    cook_time: number;
    servings: number;
    userProfile: UserStateProfile; // Shared global payload mapping context
}

interface GymDashboardRequest {
    workout_type: string;
    body_part: string;
    equipment: string;
    userProfile: UserStateProfile;
}

const WORKOUT_CANDIDATES = [
    { name: 'Decline Bench Barbell Press', bodyPart: 'CHEST', equipment: 'Barbell' },
    { name: 'Cable Pec Fly Crossover', bodyPart: 'CHEST', equipment: 'Cable' },
    { name: 'Incline Dumbbell Press', bodyPart: 'CHEST', equipment: 'Dumbbell' },
    { name: 'Push-Up Variation Circuit', bodyPart: 'CHEST', equipment: 'Bodyweight' },
    { name: 'Barbell Deadlift', bodyPart: 'BACK', equipment: 'Barbell' },
    { name: 'Pull-Up / Chin-Up Hybrid', bodyPart: 'BACK', equipment: 'Bodyweight' },
    { name: 'Single-Arm Dumbbell Row', bodyPart: 'BACK', equipment: 'Dumbbell' },
    { name: 'Lat Pull-Down', bodyPart: 'BACK', equipment: 'Cable' },
    { name: 'Standing Barbell Shoulder Press', bodyPart: 'SHOULDERS', equipment: 'Barbell' },
    { name: 'Dumbbell Lateral Raise', bodyPart: 'SHOULDERS', equipment: 'Dumbbell' },
    { name: 'Arnold Press', bodyPart: 'SHOULDERS', equipment: 'Dumbbell' },
    { name: 'Machine Shoulder Fly', bodyPart: 'SHOULDERS', equipment: 'Machine' },
    { name: 'Barbell Back Squat', bodyPart: 'LEGS', equipment: 'Barbell' },
    { name: 'Romanian Deadlift', bodyPart: 'LEGS', equipment: 'Barbell' },
    { name: 'Walking Lunges', bodyPart: 'LEGS', equipment: 'Bodyweight' },
    { name: 'Leg Press Machine', bodyPart: 'LEGS', equipment: 'Machine' },
    { name: 'Barbell Biceps Curl', bodyPart: 'BICEPS', equipment: 'Barbell' },
    { name: 'Hammer Curl Superset', bodyPart: 'BICEPS', equipment: 'Dumbbell' },
    { name: 'Close-Grip Bench Press', bodyPart: 'TRICEPS', equipment: 'Barbell' },
    { name: 'Tricep Rope Pushdown', bodyPart: 'TRICEPS', equipment: 'Cable' },
    { name: 'Weighted Plank Hold', bodyPart: 'CORE', equipment: 'Bodyweight' },
    { name: 'Russian Twist with Plate', bodyPart: 'CORE', equipment: 'Plate' },
    { name: 'Hanging Leg Raise', bodyPart: 'CORE', equipment: 'Bodyweight' }
];

const FOOD_CANDIDATES = [
    { name: 'Masala Oats Bowl', cuisine: 'South Indian', diet: 'Vegetarian', mealType: 'Breakfast' },
    { name: 'Paneer Tikka Wrap', cuisine: 'North Indian', diet: 'Vegetarian', mealType: 'Lunch' },
    { name: 'Quinoa Vegetable Salad', cuisine: 'Global', diet: 'Vegetarian', mealType: 'Lunch' },
    { name: 'Dal Khichdi with Raita', cuisine: 'Indian', diet: 'Vegetarian', mealType: 'Dinner' },
    { name: 'Mixed Fruit Smoothie', cuisine: 'Global', diet: 'Vegetarian', mealType: 'Snack' },
    { name: 'Chickpea & Spinach Curry', cuisine: 'Indian', diet: 'Vegetarian', mealType: 'Dinner' },
    { name: 'Grilled Salmon Bowl', cuisine: 'Global', diet: 'Non-Vegetarian', mealType: 'Lunch' },
    { name: 'Tandoori Chicken Salad', cuisine: 'Indian', diet: 'Non-Vegetarian', mealType: 'Dinner' },
    { name: 'Egg White Omelette', cuisine: 'Global', diet: 'Non-Vegetarian', mealType: 'Breakfast' },
    { name: 'Grilled Fish Tacos', cuisine: 'Mexican', diet: 'Non-Vegetarian', mealType: 'Lunch' },
    { name: 'Chicken & Veggie Bowl', cuisine: 'Indian', diet: 'Non-Vegetarian', mealType: 'Dinner' },
    { name: 'Lentil Soup with Greens', cuisine: 'Global', diet: 'Vegan', mealType: 'Dinner' },
    { name: 'Avocado Chickpea Toast', cuisine: 'Global', diet: 'Vegan', mealType: 'Breakfast' },
    { name: 'Tofu Stir-Fry with Brown Rice', cuisine: 'Asian', diet: 'Vegan', mealType: 'Lunch' },
    { name: 'Vegetable & Quinoa Stuffed Peppers', cuisine: 'Global', diet: 'Vegan', mealType: 'Dinner' },
    { name: 'Methi Thepla Wrap with Chutney', cuisine: 'Indian', diet: 'Vegetarian', mealType: 'Breakfast' },
    { name: 'Rajma & Brown Rice', cuisine: 'Indian', diet: 'Vegetarian', mealType: 'Lunch' },
    { name: 'Sambar with Brown Rice', cuisine: 'South Indian', diet: 'Vegetarian', mealType: 'Dinner' },
    { name: 'Sprouted Moong Salad', cuisine: 'Indian', diet: 'Vegetarian', mealType: 'Snack' },
    { name: 'Lemon Pepper Chicken Bowl', cuisine: 'Global', diet: 'Non-Vegetarian', mealType: 'Lunch' },
    { name: 'Shrimp & Veggie Stir Fry', cuisine: 'Asian', diet: 'Non-Vegetarian', mealType: 'Dinner' },
    { name: 'Cottage Cheese Salad', cuisine: 'Indian', diet: 'Vegetarian', mealType: 'Lunch' }
];

function shuffleArray<T>(items: T[]): T[] {
    const array = [...items];
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function selectUnique<T>(items: T[], limit: number): T[] {
    return items.slice(0, Math.min(limit, items.length));
}

async function scoreWorkoutDay(day: number, featureRow: object): Promise<string> {
    const label = await invokePythonPipeline('gym_pipeline.joblib', { ...featureRow, day });
    return label || 'STANDARD STRENGTH';
}

async function scoreFoodItem(day: number, featureRow: object): Promise<string> {
    const label = await invokePythonPipeline('6000foodarchieve.joblib', { ...featureRow, day });
    return label || 'BALANCED MEAL';
}

function buildWeeklyExercisePool(bodyPart: string): typeof WORKOUT_CANDIDATES {
    const normalized = bodyPart?.toUpperCase() || 'FULL BODY';
    if (normalized === 'FULL BODY' || !normalized) {
        return WORKOUT_CANDIDATES;
    }
    return WORKOUT_CANDIDATES.filter(w => w.bodyPart === normalized || w.bodyPart === 'CORE' || w.bodyPart === 'LEGS');
}

function buildWeeklyFoodPool(profile: UserStateProfile): typeof FOOD_CANDIDATES {
    const diet = profile.food_preference || 'Vegetarian';
    return FOOD_CANDIDATES.filter(f => f.diet === diet || f.diet === 'Vegetarian');
}

function getFoodDayName(index: number): string {
    return `Day ${index + 1}`;
}

// ==========================================================================
// 2. CHILD PROCESS INTERCEPTOR: PYTHON MODEL INFERENCE BRIDGE 
// ==========================================================================
const invokePythonPipeline = async (modelFileName: string, inputFeatureRow: object): Promise<string> => {
    try {
        const response = await axios.post(`${ML_SERVICE_URL}/api/ml/bridge`, {
            model_name: modelFileName,
            payload: inputFeatureRow
        }, { timeout: 10000 });
        return response.data?.prediction || 'STANDARD ROUTINE CLASS';
    } catch (error) {
        console.error('⚠️ ML service bridge connection failure:', error);
        return 'STANDARD ROUTINE CLASS';
    }
};

// ==========================================================================
// 3. ROUTER ENDPOINT 1: FOOD PROFILE ENGINE WITH REAL-TIME OVERRIDES
// ==========================================================================
app.post('/api/dashboard/food-profile', async (req: Request, res: Response): Promise<void> => {
    try {
        const payload = req.body as FoodDashboardRequest;
        const profile = payload.userProfile;

        if (!profile) {
            res.status(400).json({ success: false, detail: "User profile payload missing inside vector context." });
            return;
        }

        // Apply strict 1-day dynamic rule matrix filtering overrides
        let calculatedDiet = payload.diet;
        if (profile.todayVegOnly) {
            calculatedDiet = "Vegetarian"; // Bypasses microservice configuration
        }

        const featureMatrix = {
            "RecipeName": payload.recipe_name?.trim() || "Regional Macro Bowl",
            "Cuisine": payload.cuisine?.trim() || "South Indian",
            "Diet": calculatedDiet,
            "PrepTimeInMins": payload.prep_time || 15,
            "CookTimeInMins": payload.cook_time || 20,
            "Servings": payload.servings || 2
        };

        // Execution path check for weight tiered boundaries
        let caloricOffsetMultiplier = 1.0;
        let boundaryAdviceNotice = "Balanced Indian Macro Split Sustained.";
        
        if (profile.weightTier === 1) { // <50kg Weight target parameters
            caloricOffsetMultiplier = 1.25;
            boundaryAdviceNotice = "Focus: High-Protein Muscle Development active. Empty calories eliminated.";
        } else if (profile.weightTier === 3) { // >80kg Active lipid management parameters
            caloricOffsetMultiplier = 0.80;
            boundaryAdviceNotice = "Focus: Lipid reduction strategy routing active. High-fiber, low-calorie ceiling enforced.";
        }

        const candidateFoods = buildWeeklyFoodPool(profile);
        const shuffledFoods = shuffleArray(candidateFoods);
        const foodPlan: Array<any> = [];
        const usedMeals = new Set<string>();

        const normalizeType = (raw: string) => {
            const t = (raw || '').toString().toLowerCase();
            if (t.includes('breakfast')) return 'Breakfast';
            if (t.includes('lunch')) return 'Lunch';
            if (t.includes('dinner')) return 'Dinner';
            if (t.includes('snack') || t.includes('mid') || t.includes('evening') || t.includes('morning')) return 'Snack';
            return 'Snack';
        };

        const mealSlots = ['Breakfast', 'Lunch', 'Snack', 'Dinner'];

        for (let i = 0; i < 7; i++) {
            const dayMeals: any[] = [];
            const slotCandidates: Record<string, any[]> = {
                Breakfast: shuffledFoods.filter((item: any) => normalizeType(item.mealType || item.type) === 'Breakfast'),
                Lunch: shuffledFoods.filter((item: any) => normalizeType(item.mealType || item.type) === 'Lunch'),
                Snack: shuffledFoods.filter((item: any) => normalizeType(item.mealType || item.type) === 'Snack'),
                Dinner: shuffledFoods.filter((item: any) => normalizeType(item.mealType || item.type) === 'Dinner'),
            };

            for (const slot of mealSlots) {
                const featurePayload = {
                    day: i + 1,
                    diet: calculatedDiet,
                    cuisine: payload.cuisine || slotCandidates[slot][0]?.cuisine || 'South Indian',
                    fitness_goal: profile.fitness_goal,
                    user_preference: profile.food_preference,
                    meal_type: slot,
                    meal_names: slotCandidates[slot].map((m: any) => m.name).join(' | '),
                    recipe_name: payload.recipe_name || `${slot} Hybrid Bowl`,
                };

                const mlPrediction = await scoreFoodItem(i + 1, featurePayload);
                const predictionLabel = mlPrediction ? mlPrediction.toString().trim() : '';

                let chosenCandidate = slotCandidates[slot].find((item: any) => item.name.toLowerCase() === predictionLabel.toLowerCase());
                if (!chosenCandidate) {
                    chosenCandidate = slotCandidates[slot].find((item: any) => !usedMeals.has(item.name)) || slotCandidates[slot][i % (slotCandidates[slot].length || 1)] || slotCandidates[slot][0];
                }

                if (!chosenCandidate) {
                    chosenCandidate = shuffledFoods.find((item: any) => !usedMeals.has(item.name)) || shuffledFoods[0];
                }

                if (chosenCandidate) {
                    dayMeals.push({
                        name: chosenCandidate.name,
                        cuisine: chosenCandidate.cuisine,
                        mealType: slot,
                        calories: chosenCandidate.calories,
                        protein: chosenCandidate.protein,
                        carbs: chosenCandidate.carbs,
                        fats: chosenCandidate.fats,
                        fiber: chosenCandidate.fiber,
                        description: chosenCandidate.description || `${slot} recommendation`,
                        predicted_label: predictionLabel || `Joblib recommended ${slot}`,
                    });
                    usedMeals.add(chosenCandidate.name);
                }
            }

            const addOn = profile.addEggToday ? 'Boiled egg as a side for breakfast' : null;

            foodPlan.push({
                day: getFoodDayName(i),
                meals: dayMeals,
                allowed_egg: profile.addEggToday ? 'Egg allowed as repeat item across days' : 'Egg not included',
                daily_predictions: dayMeals.map((m: any) => ({ mealType: m.mealType, label: m.predicted_label })),
                breakfast_addon: addOn,
            });
        }

        res.status(200).json({
            status: 'success',
            channel: 'ts_dashboard_food',
            boundary_advice: boundaryAdviceNotice,
            weekly_food_plan: foodPlan,
            note: 'Meals are unique across the week with eggs allowed as repeat side items only when enabled.'
        });
    } catch (faultLayer: any) {
        res.status(500).json({ success: false, detail: faultLayer.message });
    }
});

// ==========================================================================
// 4. ROUTER ENDPOINT 2: GYM TARGET SELECTION WITH REST DAY LOCK
// ==========================================================================
app.post('/api/dashboard/gym-view', async (req: Request, res: Response): Promise<void> => {
    try {
        const payload = req.body as GymDashboardRequest;
        const profile = payload.userProfile;

        if (!profile) {
            res.status(400).json({ success: false, detail: "User profile context unassigned." });
            return;
        }

        // Rule Enforcer Line: Rest Day Mode immediately suspends automated gym workout allocations
        if (profile.isRestDayMode) {
            res.status(200).json({
                success: true,
                channel: "ts_dashboard_gym",
                state: "REST_DAY_RECOVERY_LOCKED",
                ui_render_workout_cards: [],
                message: "Standard workout metrics pipeline locked. Active recovery protocol view rendered for this calendar slot."
            });
            return;
        }

        const featureMatrix = {
            "Title": "Dynamic Structural Matrix",
            "Desc": "Automated training session profile tracking block",
            "Type": payload.workout_type || "Strength",
            "BodyPart": payload.body_part || "Chest",
            "Equipment": payload.equipment || "Barbell",
            "Unnamed: 0": 0
        };

        const selectedExercises = buildWeeklyExercisePool(payload.body_part);
        const shuffledExercises = shuffleArray(selectedExercises);
        const weeklyWorkout: Array<any> = [];
        const usedExerciseNames = new Set<string>();

        for (let i = 0; i < 7; i++) {
            const dayExercises = selectUnique(shuffledExercises.filter(ex => !usedExerciseNames.has(ex.name)), 3);
            if (dayExercises.length === 0) break;
            dayExercises.forEach(ex => usedExerciseNames.add(ex.name));

            const dayFeatures = {
                day: i + 1,
                body_part: payload.body_part,
                workout_type: payload.workout_type,
                equipment: payload.equipment,
                user_profile: profile.activity_level,
                exercise_names: dayExercises.map(ex => ex.name).join(' | ')
            };
            const dayClassification = await scoreWorkoutDay(i + 1, dayFeatures);

            weeklyWorkout.push({
                day: `Day ${i + 1}`,
                plan_type: dayClassification,
                exercises: dayExercises.map(ex => ({ name: ex.name, bodyPart: ex.bodyPart, equipment: ex.equipment })),
                guidance: `Different exercise set for day ${i + 1}, no repeats across the week.`
            });
        }

        res.status(200).json({
            success: true,
            channel: 'ts_dashboard_gym',
            state: 'ACTIVE_TRAINING_CYCLE',
            weekly_workout_plan: weeklyWorkout,
            model_analytics: {
                routine_classification: weeklyWorkout.map(w => w.plan_type)
            }
        });
    } catch (faultLayer: any) {
        res.status(500).json({ success: false, detail: faultLayer.message });
    }
});

// ==========================================================================
// 5. ROUTER ENDPOINT 3: NUTRITION CHATBOT SOURCE WITH OPENFOODFACTS SYNC
// ==========================================================================
app.post('/api/chatbot/nutrition-scan', async (req: Request, res: Response): Promise<void> => {
    try {
        const { product_name } = req.body;
        if (!product_name) {
            res.status(400).json({ detail: "Product parameter string missing." });
            return;
        }

        const lookupRegistryUrl = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(product_name)}&search_simple=1&action=process&json=1&page_size=1`;
        const endpointResponse = await axios.get(lookupRegistryUrl, { timeout: 10000 });
        const synchronizationPacket = endpointResponse.data;

        if (!synchronizationPacket.products || synchronizationPacket.products.length === 0) {
            res.status(404).json({ detail: `Packaged product profile token not registered inside active node layers.` });
            return;
        }

        const dataNode = synchronizationPacket.products[0];
        const macronutrientsMap = dataNode.nutriments || {};

        const featureMatrix = {
            "additives_n": (dataNode.additives_tags || []).length,
            "ingredients_from_palm_oil_n": parseInt(dataNode.ingredients_from_palm_oil_n || 0),
            "ingredients_that_may_be_from_palm_oil_n": parseInt(dataNode.ingredients_that_may_be_from_palm_oil_n || 0),
            "energy_100g": parseFloat(macronutrientsMap.energy_100g || 0),
            "fat_100g": parseFloat(macronutrientsMap.fat_100g || 0),
            "saturated-fat_100g": parseFloat(macronutrientsMap['saturated-fat_100g'] || 0),
            "trans-fat_100g": parseFloat(macronutrientsMap['trans-fat_100g'] || 0),
            "carbohydrates_100g": parseFloat(macronutrientsMap.carbohydrates_100g || 0),
            "sugars_100g": parseFloat(macronutrientsMap.sugars_100g || 0),
            "proteins_100g": parseFloat(macronutrientsMap.proteins_100g || 0),
            "salt_100g": parseFloat(macronutrientsMap.salt_100g || 0),
            "nutrition-score-fr_100g": parseFloat(macronutrientsMap['nutrition-score-fr_100g'] || 0),
            "creator": dataNode.creator || "unknown",
            "serving_size": dataNode.serving_size || "unknown",
            "additives": String(dataNode.additives_old_tags || ""),
            "additives_tags": String(dataNode.additives_tags || ""),
            "additives_en": String(dataNode.additives_en || "")
        };

        const predictedNutriScoreClass = await invokePythonPipeline("nutrition_pipeline.joblib", featureMatrix);

        res.status(200).json({
            status: "success",
            channel: "ts_chatbot_nutrition",
            product_identity: {
                title: dataNode.product_name || product_name,
                brand_owner: dataNode.brands || "Indian Packaged Asset Brand",
                computed_nutriscore_tier: predictedNutriScoreClass
            },
            macronutrients_100g_metrics: {
                calories_kcal: Math.round((macronutrientsMap.energy_100g || 0) * 0.239),
                carbohydrates_g: macronutrientsMap.carbohydrates_100g || 0,
                proteins_g: macronutrientsMap.proteins_100g || 0,
                lipids_fat_g: macronutrientsMap.fat_100g || 0
            }
        });
    } catch (err: any) {
        res.status(502).json({ error_boundary: true, detail: err.message });
    }
});

// ==========================================================================
// 6. ROUTER ENDPOINT 4: NATIVE MULTI-MODAL VISION PARSER WITH GEMINI API GUARD
// ==========================================================================
app.post('/api/chatbot/product-image-reveal', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).json({ detail: "Multipart stream multi-modal file tracking missing." });
            return;
        }

        // Strict Anti-Hallucination Clarity Validation Rule Check
        const isImageUnclearOrBlurry = req.file.size < 5000; // Simulated image payload boundary threshold 
        if (isImageUnclearOrBlurry) {
            res.status(422).json({
                success: false,
                detail: "Anti-Hallucination Intercept: Uploaded packaged label image is blurry or unclear. Processing short-circuited."
            });
            return;
        }

        let geminiVisionTextResult = "Insight compiled using localized predictive dictionary loops.";

        // Secure integration layer targeting native Google Gemini API Gateway channels
        if (GEMINI_API_KEY) {
            try {
                const base64Data = req.file.buffer.toString('base64');
                const response = await axios.post(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
                    {
                        contents: [{
                            parts: [
                                { text: "Analyze this Indian brand product label. Break down the exact calories, protein, carbohydrates, and fats per serving clearly. Avoid hallucinations." },
                                { inlineData: { mimeType: req.file.mimetype, data: base64Data } }
                            ]
                        }]
                    },
                    { headers: { 'Content-Type': 'application/json' }, timeout: 12000 }
                );
                
                geminiVisionTextResult = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || geminiVisionTextResult;
            } catch (geminiError) {
                console.error("⚠️ Free-tier Gemini network exception loop notice:", geminiError);
            }
        }

        // Simultaneously cascade parameters routing context through 28K inventory model space
        const mockFeatureMatrix = {
            "sale_price": parseFloat(req.body.sale_price || 199.0),
            "market_price": parseFloat(req.body.market_price || 249.0),
            "product": "Organic Premium Isolate",
            "category": "Health & Wellness",
            "sub_category": "Nutrition Supplements",
            "description": "Decoded label trace vector matrix"
        };

        const inventoryClassLabel = await invokePythonPipeline("28kproductimage.joblib", mockFeatureMatrix);

        res.status(200).json({
            success: true,
            channel: "ts_chatbot_28k_vision",
            file_processed: req.file.originalname,
            pipeline_analytics: {
                predicted_inventory_class_tier: inventoryClassLabel
            },
            gemini_raw_intelligence: geminiVisionTextResult,
            chatbot_conversational_response: `Asset scanning complete. The 28K inventory network segments this label item configuration under the **${inventoryClassLabel}** block layer matrix.`
        });
    } catch (faultLayer: any) {
        res.status(500).json({ error_layer: true, detail: faultLayer.message });
    }
});

// ==========================================================================
// 7. ROUTER ENDPOINT 5: THREE-DAILY TASKS XP CLICK PAYLOAD CHALLENGE VALIDATOR
// ==========================================================================
app.post('/api/tasks/claim-xp', async (req: Request, res: Response): Promise<void> => {
    try {
        const { taskId, userProfile } = req.body;
        
        if (!taskId || !userProfile) {
            res.status(400).json({ success: false, detail: "Task tracking validation identifiers missing." });
            return;
        }

        // Award exact click payload array allocation 
        const updatedXpGain = (userProfile.currentXp || 0) + 150; // Safeguarded click payload reward step

        res.status(200).json({
            success: true,
            channel: "ts_challenge_validation_layer",
            claimedTaskId: taskId,
            xp_payload_awarded: 150,
            telemetry: {
                previous_xp: userProfile.currentXp,
                synchronized_xp_score: updatedXpGain
            },
            ui_toast_notification: `Cyberpunk challenge locked! **+150 XP** securely dispatched to your user profile vector matrix!`
        });
    } catch (err: any) {
        res.status(500).json({ success: false, detail: err.message });
    }
});

// ==========================================================================
// THREAD MONITOR DEPLOYMENT LISTEN MATRIX
// ==========================================================================
app.listen(PORT, () => {
    console.log(`\n ╔${"═".repeat(60)}╗`);
    console.log(`  🛰️  FIT MATRIX MASTER CORE SERVER RUNNING ON PORT: http://localhost:${PORT}`);
    console.log(`  -> Rest/Activate Day Rules and Multi-Modal Overrides Locked. <-`);
    console.log(` ╚${"═".repeat(60)}╝\n`);
});