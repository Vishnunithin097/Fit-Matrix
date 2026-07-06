import { query } from '../config/db.js';
import fs from 'fs';
import path from 'path';
import { normalizeFoodPreference } from '../utils/foodPreference.js';
// Helper to load traditional database backups
function getBackupDataset(preference) {
    try {
        const filename = preference === 'Vegetarian' ? 'veg_dataset.json' : 'nonveg_dataset.json';
        const filePath = path.join(process.cwd(), 'backend', 'src', 'data', filename);
        // Check if file exists, if not, try relative to current file or fallback
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf-8');
            return JSON.parse(data);
        }
        else {
            // Direct load attempt for standard build execution
            const altPath = path.join(process.cwd(), 'src', 'data', filename);
            if (fs.existsSync(altPath)) {
                return JSON.parse(fs.readFileSync(altPath, 'utf-8'));
            }
        }
    }
    catch (err) {
        console.error('Error loading dataset file:', err);
    }
    return [];
}
// 1. GENERATE OR FETCH DIET & WORKOUT PLANS (Hybrid Model)
export async function getPlan(req, res) {
    const userId = req.user?.id;
    if (!userId) {
        return res.status(401).json({ error: 'Authentication required.' });
    }
    try {
        // Fetch full user profile
        const result = await query('SELECT * FROM users WHERE id = $1', [userId]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }
        const user = result.rows[0];
        // If User is on REST DAY, temporarily suspend plans and output a specialized rest payload
        if (!user.activate_day) {
            return res.status(200).json({
                mode: 'REST_DAY',
                message: 'Rest & Recovery Protocol is Active. Intense physical protocols suspended.',
                meals_plan: {
                    days: Array(7).fill({
                        Breakfast: { name: "Oats with Raw Honey & Almonds", calories: 280, protein: 10, carbs: 45, fats: 8, fiber: 6, description: "Gentle recovery meal." },
                        "Mid-Morning Snack": { name: "Fresh Pomegranate Juice", calories: 120, protein: 1, carbs: 28, fats: 0, fiber: 3, description: "Antioxidant rich juice." },
                        Lunch: { name: "Steamed Curd Rice with Cucumber", calories: 350, protein: 8, carbs: 55, fats: 6, fiber: 2, description: "Probiotic digestive recovery bowl." },
                        "Evening Snack": { name: "Roasted Makhana & Coconut Water", calories: 140, protein: 4, carbs: 24, fats: 2, fiber: 3, description: "Hydrating mineral snack." },
                        Dinner: { name: "Light Moong Dal Khichdi & Salad", calories: 340, protein: 11, carbs: 52, fats: 5, fiber: 5, description: "Warm, digestible split-pulse and rice bowl." }
                    })
                },
                workout_plan: {
                    routine: {
                        warmUp: [{ exercise: "Deep Diaphragmatic Breathing", sets: 1, reps: 10, duration: 5, caloriesBurned: 10, targetMuscle: "Diaphragm", difficulty: "Beginner" }],
                        strength: [],
                        cardio: [],
                        flexibility: [
                            { exercise: "Child's Pose (Balasana)", sets: 3, reps: 1, duration: 6, caloriesBurned: 15, targetMuscle: "Lower Back", difficulty: "Beginner" },
                            { exercise: "Cat-Cow Stretch", sets: 3, reps: 10, duration: 4, caloriesBurned: 15, targetMuscle: "Spine", difficulty: "Beginner" }
                        ],
                        coolDown: [{ exercise: "Savasana Meditation", sets: 1, reps: 1, duration: 10, caloriesBurned: 5, targetMuscle: "Mind/CNS", difficulty: "Beginner" }],
                        totalDuration: 25,
                        totalCaloriesBurned: 45
                    }
                }
            });
        }
        // Check if plans are already generated, if not generate them
        let mealsPlan = user.meals_plan;
        let workoutPlan = user.workout_plan;
        if (!mealsPlan || !workoutPlan) {
            console.log(`Plans empty for user ${userId}. Triggering 7-Day Hybrid Generation...`);
            mealsPlan = generateMealPlanHybrid(user);
            workoutPlan = generateWorkoutPlanHybrid(user);
            // Save generated plan to PostgreSQL
            await query('UPDATE users SET meals_plan = $1, workout_plan = $2 WHERE id = $3', [JSON.stringify(mealsPlan), JSON.stringify(workoutPlan), userId]);
        }
        // Apply dynamic toggles to the returned plan
        const processedMealsPlan = applyMealToggles(mealsPlan, user.egg_today, user.veg_only_today, user.region_preference);
        return res.status(200).json({
            mode: 'ACTIVATE_DAY',
            meals_plan: processedMealsPlan,
            workout_plan: workoutPlan,
            egg_today: user.egg_today,
            veg_only_today: user.veg_only_today
        });
    }
    catch (error) {
        console.error('Get Plan Error:', error);
        return res.status(500).json({ error: 'Server error retrieving plans.' });
    }
}
// 2. TOGGLE DAY MODES (ACTIVATE DAY vs. REST DAY)
export async function toggleDayMode(req, res) {
    const userId = req.user?.id;
    const { mode } = req.body; // 'ACTIVATE' or 'REST'
    if (!userId) {
        return res.status(401).json({ error: 'Authentication required.' });
    }
    try {
        const activateDay = mode === 'ACTIVATE';
        await query('UPDATE users SET activate_day = $1 WHERE id = $2', [activateDay, userId]);
        return res.status(200).json({
            message: `System transitioned to ${activateDay ? 'ACTIVATE DAY' : 'REST DAY'} mode successfully.`,
            activate_day: activateDay
        });
    }
    catch (error) {
        console.error('Toggle Day Mode Error:', error);
        return res.status(500).json({ error: 'Server error shifting operational day modes.' });
    }
}
// 3. DIET TOGGLES (ADD EGG TODAY / VEG ONLY TODAY)
export async function toggleDietRule(req, res) {
    const userId = req.user?.id;
    const { eggToday, vegOnlyToday } = req.body;
    if (!userId) {
        return res.status(401).json({ error: 'Authentication required.' });
    }
    try {
        const result = await query('SELECT egg_today, veg_only_today FROM users WHERE id = $1', [userId]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }
        const currentEgg = eggToday !== undefined ? eggToday : result.rows[0].egg_today;
        const currentVegOnly = vegOnlyToday !== undefined ? vegOnlyToday : result.rows[0].veg_only_today;
        await query('UPDATE users SET egg_today = $1, veg_only_today = $2 WHERE id = $3', [currentEgg, currentVegOnly, userId]);
        return res.status(200).json({
            message: 'Dietary modifiers updated successfully.',
            egg_today: currentEgg,
            veg_only_today: currentVegOnly
        });
    }
    catch (error) {
        console.error('Toggle Diet Rule Error:', error);
        return res.status(500).json({ error: 'Server error adjusting dietary parameters.' });
    }
}
// ======================== HYBRID GENERATORS (FALLBACK RULES) ========================
function generateMealPlanHybrid(user) {
    // Load traditional datasets
    const vegBackup = getBackupDataset('Vegetarian');
    const nonVegBackup = getBackupDataset('Non-Vegetarian');
    const normalizedPreference = normalizeFoodPreference(user.food_preference);
    // Decide dataset based on user preference
    const dataset = normalizedPreference === 'Vegetarian'
        ? vegBackup
        : normalizedPreference === 'Mixed'
            ? [...nonVegBackup, ...vegBackup]
            : nonVegBackup;
    if (!dataset || dataset.length === 0) {
        // Extreme safety default block
        return {
            days: Array(7).fill({
                Breakfast: { name: "Idli with Sambhar", calories: 300, protein: 8, carbs: 55, fats: 4, fiber: 5, description: "Classic safety diet" },
                "Mid-Morning Snack": { name: "Fruit Salad", calories: 120, protein: 2, carbs: 25, fats: 0, fiber: 4, description: "Fresh mixed fruit cubes" },
                Lunch: { name: "Dal Chawal with Salad", calories: 450, protein: 12, carbs: 70, fats: 10, fiber: 6, description: "Lentils and steamed rice" },
                "Evening Snack": { name: "Roasted Chana", calories: 150, protein: 7, carbs: 24, fats: 3, fiber: 5, description: "Roasted chick peas" },
                Dinner: { name: "Mixed Vegetable Curry with 2 Roti", calories: 380, protein: 10, carbs: 58, fats: 8, fiber: 7, description: "Balanced wheat flatbreads" }
            })
        };
    }
    // Weight-based calibration rules
    // Users < 50kg: Weight Gain (+20% calories to foods)
    // Users 50kg to 80kg: Maintain / Balance
    // Users > 80kg: Fat Loss (-20% calories to foods)
    let calorieScale = 1.0;
    if (user.weight < 50)
        calorieScale = 1.2;
    else if (user.weight > 80)
        calorieScale = 0.8;
    const mealTypes = ['Breakfast', 'Mid-Morning Snack', 'Lunch', 'Evening Snack', 'Dinner'];
    const days = [];
    // Generate 7 days, avoiding consecutive repetition
    for (let d = 0; d < 7; d++) {
        const dayPlan = {};
        mealTypes.forEach(mType => {
            // Filter dishes matching mealType
            let choices = dataset.filter((item) => item.mealType === mType);
            // Filter by Region if possible to give personalized feel, otherwise fallback
            let regionalChoices = choices.filter((item) => item.region === user.region_preference);
            if (regionalChoices.length > 0) {
                choices = regionalChoices;
            }
            // Select random item
            const index = (d + mType.length) % choices.length;
            const baseItem = choices[index] || choices[0];
            // Clone and apply calorie scale
            dayPlan[mType] = {
                name: baseItem.name,
                calories: Math.round(baseItem.calories * calorieScale),
                protein: Math.round(baseItem.protein * (calorieScale > 1.0 ? 1.1 : calorieScale < 1.0 ? 0.95 : 1.0)),
                carbs: Math.round(baseItem.carbs * calorieScale),
                fats: Math.round(baseItem.fats * calorieScale),
                fiber: baseItem.fiber,
                description: baseItem.description
            };
        });
        days.push(dayPlan);
    }
    return { days };
}
function applyMealToggles(mealsPlan, eggToday, vegOnlyToday, regionPref) {
    if (!mealsPlan || !mealsPlan.days)
        return mealsPlan;
    // Deep clone mealsPlan
    const planCopy = JSON.parse(JSON.stringify(mealsPlan));
    const currentDay = planCopy.days[0]; // Apply to today (Day 1)
    // 1. Apply Today Veg Only Toggle
    if (vegOnlyToday) {
        const vegBackup = getBackupDataset('Vegetarian');
        const mealTypes = ['Breakfast', 'Mid-Morning Snack', 'Lunch', 'Evening Snack', 'Dinner'];
        mealTypes.forEach(mType => {
            // If current meal contains meat words, replace it with a veg dish
            const nameLower = currentDay[mType].name.toLowerCase();
            const isNonVeg = nameLower.includes('chicken') || nameLower.includes('fish') || nameLower.includes('egg') || nameLower.includes('mutton') || nameLower.includes('prawn') || nameLower.includes('duck');
            if (isNonVeg) {
                let choices = vegBackup.filter((v) => v.mealType === mType);
                let regionalChoices = choices.filter((v) => v.region === regionPref);
                const selected = regionalChoices.length > 0 ? regionalChoices[0] : choices[0];
                if (selected) {
                    currentDay[mType] = {
                        name: `[VEG ONLY] ${selected.name}`,
                        calories: selected.calories,
                        protein: selected.protein,
                        carbs: selected.carbs,
                        fats: selected.fats,
                        fiber: selected.fiber,
                        description: selected.description
                    };
                }
            }
        });
    }
    // 2. Apply Add Egg Today Toggle
    if (eggToday) {
        // Add 2 boiled eggs to Breakfast or Evening Snack (150 kcal, 13g protein, 10g fat)
        const targetMeal = currentDay['Breakfast'] ? 'Breakfast' : 'Evening Snack';
        currentDay[targetMeal].name = `${currentDay[targetMeal].name} + 2 Boiled Eggs`;
        currentDay[targetMeal].calories += 150;
        currentDay[targetMeal].protein += 13;
        currentDay[targetMeal].fats += 10;
        currentDay[targetMeal].description += " (Injected 2 high-protein boiled eggs).";
    }
    return planCopy;
}
function generateWorkoutPlanHybrid(user) {
    // Determine weight-based fitness protocols
    // Users < 50kg: Muscle-Building Focus
    // Users 50-80kg: Balance Maintenance
    // Users > 80kg: Fat-Loss-focused routines
    let theme = 'Balanced Maintenance';
    let scalingFactor = 1.0;
    if (user.weight < 50) {
        theme = 'Hypertrophy Muscle-Building';
        scalingFactor = 1.1; // slightly higher load
    }
    else if (user.weight > 80) {
        theme = 'Fat-Loss Metabolic Burn';
        scalingFactor = 0.9; // higher reps, lower weights
    }
    // Build specialized components
    const warmUp = [
        { exercise: "Dynamic Shoulder Rotations", sets: 2, reps: 15, duration: 3, caloriesBurned: 15, targetMuscle: "Shoulders/Rotator Cuff", difficulty: "Beginner" },
        { exercise: "Jumping Jacks (Cardio Activation)", sets: 3, reps: 30, duration: 4, caloriesBurned: 35, targetMuscle: "Full Body", difficulty: "Beginner" }
    ];
    let strength = [];
    if (user.weight < 50) {
        // Muscle building: heavy load, lower reps
        strength = [
            { exercise: "Barbell Squats", sets: 4, reps: 8, duration: 10, caloriesBurned: 110, targetMuscle: "Quadriceps/Glutes", difficulty: "Intermediate" },
            { exercise: "Dumbbell Bench Press", sets: 4, reps: 10, duration: 8, caloriesBurned: 90, targetMuscle: "Chest/Triceps", difficulty: "Intermediate" },
            { exercise: "Deadlifts (Traditional)", sets: 3, reps: 6, duration: 10, caloriesBurned: 140, targetMuscle: "Posterior Chain", difficulty: "Advanced" }
        ];
    }
    else if (user.weight > 80) {
        // Fat loss: high reps, metabolic circuits
        strength = [
            { exercise: "Bodyweight Goblet Squats", sets: 4, reps: 20, duration: 8, caloriesBurned: 95, targetMuscle: "Legs", difficulty: "Beginner" },
            { exercise: "Push-ups (Plank Form)", sets: 4, reps: 15, duration: 6, caloriesBurned: 70, targetMuscle: "Chest/Core", difficulty: "Beginner" },
            { exercise: "Kettlebell Swings", sets: 3, reps: 25, duration: 8, caloriesBurned: 120, targetMuscle: "Glutes/Hamstrings", difficulty: "Intermediate" }
        ];
    }
    else {
        // Maintenance / General conditioning
        strength = [
            { exercise: "Dumbbell Lunges", sets: 3, reps: 12, duration: 8, caloriesBurned: 80, targetMuscle: "Thighs/Glutes", difficulty: "Beginner" },
            { exercise: "Pull-ups (or Lat Pulldowns)", sets: 3, reps: 10, duration: 8, caloriesBurned: 85, targetMuscle: "Lats/Biceps", difficulty: "Intermediate" },
            { exercise: "Plank to Push-up Transitions", sets: 3, reps: 12, duration: 6, caloriesBurned: 60, targetMuscle: "Abdominals/Triceps", difficulty: "Intermediate" }
        ];
    }
    const cardio = user.weight > 80 ? [
        // Intense calorie burning
        { exercise: "High-Intensity Interval Sprinting (HIIT)", sets: 5, reps: 1, duration: 15, caloriesBurned: 210, targetMuscle: "Cardiovascular System", difficulty: "Intermediate" },
        { exercise: "Rowing Machine Intervals", sets: 3, reps: 1, duration: 10, caloriesBurned: 120, targetMuscle: "Total Body", difficulty: "Intermediate" }
    ] : [
        // Standard stamina building
        { exercise: "Incline Treadmill Jogging", sets: 1, reps: 1, duration: 15, caloriesBurned: 130, targetMuscle: "Legs/Cardio", difficulty: "Beginner" }
    ];
    const flexibility = [
        { exercise: "Hamstring Standing Fold", sets: 2, reps: 1, duration: 3, caloriesBurned: 10, targetMuscle: "Hamstrings", difficulty: "Beginner" },
        { exercise: "Cobra Yoga Stretch (Bhujangasana)", sets: 2, reps: 1, duration: 3, caloriesBurned: 12, targetMuscle: "Abdominals/Spine", difficulty: "Beginner" }
    ];
    const coolDown = [
        { exercise: "Static Quad Hold", sets: 2, reps: 1, duration: 3, caloriesBurned: 8, targetMuscle: "Quads", difficulty: "Beginner" },
        { exercise: "Mindful Deep Savasana", sets: 1, reps: 1, duration: 5, caloriesBurned: 5, targetMuscle: "Nervous System", difficulty: "Beginner" }
    ];
    // Calculate totals
    const allWorkouts = [...warmUp, ...strength, ...cardio, ...flexibility, ...coolDown];
    const totalDuration = allWorkouts.reduce((acc, w) => acc + w.duration, 0);
    const totalCaloriesBurned = allWorkouts.reduce((acc, w) => acc + w.caloriesBurned, 0);
    return {
        routine: {
            warmUp,
            strength,
            cardio,
            flexibility,
            coolDown,
            totalDuration,
            totalCaloriesBurned
        }
    };
}
