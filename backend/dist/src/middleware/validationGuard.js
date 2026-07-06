import { normalizeFoodPreference } from '../utils/foodPreference.js';
export function validateOnboarding(req, res, next) {
    const { full_name, age, gender, height, weight, fitness_goal, food_preference, region_preference, activity_level } = req.body;
    // 1. Full Name check
    if (!full_name || typeof full_name !== 'string' || full_name.trim().length < 2) {
        return res.status(400).json({ error: 'Valid full name (minimum 2 characters) is required.' });
    }
    // 2. Age Check (10 - 120 years)
    const parsedAge = Number(age);
    if (isNaN(parsedAge) || parsedAge < 10 || parsedAge > 120) {
        return res.status(400).json({ error: 'Age must be a valid number between 10 and 120.' });
    }
    // 3. Gender check
    const allowedGenders = ['Male', 'Female', 'Other'];
    if (!gender || !allowedGenders.includes(gender)) {
        return res.status(400).json({ error: 'Gender must be one of: Male, Female, Other.' });
    }
    // 4. Height Check (100cm - 250cm)
    const parsedHeight = Number(height);
    if (isNaN(parsedHeight) || parsedHeight < 100 || parsedHeight > 250) {
        return res.status(400).json({ error: 'Height must be a valid value between 100cm and 250cm.' });
    }
    // 5. Weight Check (30kg - 250kg)
    const parsedWeight = Number(weight);
    if (isNaN(parsedWeight) || parsedWeight < 30 || parsedWeight > 250) {
        return res.status(400).json({ error: 'Weight must be a valid value between 30kg and 250kg.' });
    }
    // 6. Fitness Goal check
    const allowedGoals = ['Weight Loss', 'Muscle Gain', 'Lean Bulking', 'Endurance Training', 'Maintenance'];
    if (!fitness_goal || !allowedGoals.includes(fitness_goal)) {
        return res.status(400).json({ error: 'Fitness Goal must be one of: Weight Loss, Muscle Gain, Lean Bulking, Endurance Training, Maintenance.' });
    }
    // 7. Food Preference check
    const normalizedFoodPreference = normalizeFoodPreference(food_preference);
    const allowedFoodPrefs = ['Vegetarian', 'Non-Vegetarian', 'Mixed'];
    if (!food_preference || !allowedFoodPrefs.includes(normalizedFoodPreference)) {
        return res.status(400).json({ error: 'Food Preference must be one of: Vegetarian, Non-Vegetarian, Mixed.' });
    }
    // 8. Regional Preference check
    const allowedRegions = ['South', 'North', 'East', 'West', 'All'];
    if (!region_preference || !allowedRegions.includes(region_preference)) {
        return res.status(400).json({ error: 'Region Preference must be one of: South, North, East, West, All.' });
    }
    // 9. Activity Level check
    const allowedActivityLevels = ['Sedentary', 'Light', 'Moderate', 'Active', 'Very Active', 'Professional Athlete', 'Rehabilitation'];
    if (!activity_level || !allowedActivityLevels.includes(activity_level)) {
        return res.status(400).json({ error: 'Activity Level must be one of: Sedentary, Light, Moderate, Active, Very Active, Professional Athlete, Rehabilitation.' });
    }
    // Clean and sanitize the request body variables
    req.body.age = parsedAge;
    req.body.height = parsedHeight;
    req.body.weight = parsedWeight;
    req.body.food_preference = normalizedFoodPreference;
    next();
}
