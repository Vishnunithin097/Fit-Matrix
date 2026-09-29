import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildSmartChatResponse,
  deriveImageLabelCandidate,
  extractFoodNameFromFilename,
  getFoodNutritionProfile,
  normalizeFoodAnalysisResult,
} from '../src/controllers/chatbotController.ts';

test('simple nutrition queries stay short', () => {
  const output = buildSmartChatResponse('What is protein?', {
    weight: 75,
    height: 180,
    age: 28,
    goal: 'Muscle Gain',
    diet: 'Vegetarian',
    bmi: 23.1,
    workoutFrequency: '4 days/week',
  });

  assert.match(output, /Protein helps/i);
  assert.ok(output.length < 220);
});

test('food analysis includes all required fields and low-confidence guidance', () => {
  const output = normalizeFoodAnalysisResult({
    foodName: 'Unknown dish',
    confidence: 0.42,
    calories: 320,
    protein: 15,
    carbs: 26,
    fat: 12,
    fibre: 5,
    healthScore: 'Moderate',
    beforeWorkout: false,
    afterWorkout: true,
    portionRecommendation: '1 bowl',
    healthierAlternatives: ['Greek yogurt bowl', 'Oats bowl'],
    lowConfidenceMessage: 'Prediction may not be fully accurate.',
  });

  assert.deepEqual(Object.keys(output).sort(), [
    'afterWorkout',
    'beforeWorkout',
    'calories',
    'carbs',
    'confidence',
    'fat',
    'fibre',
    'foodName',
    'healthierAlternatives',
    'healthy',
    'muscleGainSuitable',
    'portionRecommendation',
    'protein',
    'servingSize',
    'sodium',
    'sugar',
    'topPredictions',
    'warning',
    'weightLossSuitable',
  ].sort());

  assert.equal(output.foodName, 'Unknown dish');
  assert.ok(output.servingSize);
  assert.ok(Array.isArray(output.topPredictions));
  assert.match(output.warning, /Prediction may not be fully accurate/i);
});

test('recovery questions reason across sleep, hydration, nutrition, and performance context', () => {
  const output = buildSmartChatResponse('I feel tired after workout', {
    weight: 72,
    height: 176,
    age: 29,
    bmi: 23.2,
    goal: 'Muscle Gain',
    diet: 'Vegetarian',
    workoutFrequency: '4 days/week',
    calorieTarget: 2400,
  });

  assert.match(output, /sleep|hydration|protein|recovery|muscle/i);
  assert.ok(output.length < 600);
});

test('local chatbot fallback answers when the ML service is unavailable', () => {
  const output = buildSmartChatResponse('How do I improve sleep and recovery?', {});

  assert.match(output, /sleep|recovery|hydration/i);
  assert.doesNotMatch(output, /temporarily unable to reach|try again shortly/i);
});

test('filename hints recover a concrete food label for ambiguous scans', () => {
  const hint = extractFoodNameFromFilename('groundnut_photo.jpg');
  assert.equal(hint, 'groundnut');
});

test('carrot and groundnut produce distinct nutrition profiles', () => {
  const carrot = getFoodNutritionProfile('carrot');
  const groundnut = getFoodNutritionProfile('groundnut');

  assert.ok(carrot.calories < groundnut.calories);
  assert.ok(groundnut.protein > carrot.protein);
  assert.notEqual(carrot.foodName, groundnut.foodName);
});

test('arbitrary uploaded images derive a usable label candidate from filename and model output', () => {
  const result = deriveImageLabelCandidate({
    filename: 'mango_lassi_photo.jpg',
    foodPrediction: 'classify_food_image',
    productPrediction: 'STANDARD ROUTINE CLASS',
  });

  assert.ok(result);
  assert.match(result.toLowerCase(), /mango|lassi/);
});

test('model-aware replies use model signals to create more varied guidance', () => {
  const output = buildSmartChatResponse('I need gym tips and better meals', {
    weight: 72,
    height: 176,
    age: 29,
    goal: 'Fat Loss',
    diet: 'Vegetarian',
    bmi: 23.2,
    workoutFrequency: '4 days/week',
  }, {
    modelOutputs: {
      nutrition_pipeline: 'Protein-focused meal guidance',
      megaGymDataset: 'Strength-based gym plan',
    },
  });

  assert.match(output, /protein|strength|gym|meal/i);
  assert.ok(output.length > 40);
});

test('complex goals produce structured markdown with headings and lists', () => {
  const output = buildSmartChatResponse('Create a muscle gain plan for my vegetarian diet and 4-day routine', {
    weight: 68,
    height: 172,
    age: 27,
    goal: 'Muscle Gain',
    diet: 'Vegetarian',
    workoutFrequency: '4 days/week',
    calorieTarget: 2600,
  });

  assert.match(output, /###|##|\d+\./);
  assert.match(output, /muscle|vegetarian|protein|workout/i);
});
