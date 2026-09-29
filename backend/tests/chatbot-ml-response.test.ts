import test from 'node:test';
import assert from 'node:assert/strict';
import { buildChatbotModelPayload, choosePrimaryModelResponse, extractModelText, massageModelResponse, formatModelResponse } from '../src/controllers/chatbotController.ts';

test('choosePrimaryModelResponse prefers nutrition model for nutrition intent', () => {
  const outputs = [
    { source: 'aichatbot', text: 'General advice.' },
    { source: 'nutrition_pipeline', text: 'Nutrition-specific guidance on protein and carbs.' },
    { source: 'train_data', text: 'Training note.' }
  ];

  const result = choosePrimaryModelResponse(outputs, {
    intent: 'nutrition',
    cues: ['protein'],
    score: { recovery: 0, nutrition: 2, workout: 0, wellness: 0, lifestyle: 0, general: 0 },
    isComparison: false,
    isPlanRequest: false,
    urgentConcern: false
  });

  assert.equal(result, 'Nutrition-specific guidance on protein and carbs.');
});

test('extractModelText parses JSON model payloads to the response field', () => {
  const jsonResponse = JSON.stringify({ response: 'Direct model answer.' });
  const result = extractModelText(jsonResponse);
  assert.equal(result, 'Direct model answer.');
});

test('massageModelResponse cleans short ML output and avoids weak phrasing', () => {
  const response = 'I think this helps';
  const result = massageModelResponse(response, {
    intent: 'nutrition',
    cues: ['protein'],
    score: { recovery: 0, nutrition: 1, workout: 0, wellness: 0, lifestyle: 0, general: 0 },
    isComparison: false,
    isPlanRequest: false,
    urgentConcern: false
  }, {}, 'ml_model');

  assert.ok(!/I think/i.test(result), 'Should remove weak phrasing from ML model output');
  assert.ok(result.length > 0);
});

test('massageModelResponse humanizes generic model labels for nutrition intent', () => {
  const response = 'STANDARD ROUTINE CLASS';
  const result = massageModelResponse(response, {
    intent: 'nutrition',
    cues: ['meal'],
    score: { recovery: 0, nutrition: 1, workout: 0, wellness: 0, lifestyle: 0, general: 0 },
    isComparison: false,
    isPlanRequest: false,
    urgentConcern: false
  }, {}, 'ml_model');

  assert.ok(result.toLowerCase().includes('balanced meals') || result.toLowerCase().includes('protein'), 'Should replace generic label with practical nutrition guidance');
});

test('buildChatbotModelPayload preserves distinct user intent in the trained joblib schema', () => {
  const payload = buildChatbotModelPayload('How do I improve sleep and recovery after training?', { goal: 'fat loss', diet: 'veg', workoutFrequency: '4x week' }, 'User is active and wants better recovery');

  assert.equal(payload.Patient, 'fitmind-user');
  assert.ok(payload.Description.toLowerCase().includes('how do i improve sleep and recovery after training'));
  assert.ok(payload.Description.toLowerCase().includes('sleep'));
  assert.ok(payload.Description.toLowerCase().includes('recovery'));
  assert.ok(payload.profileSummary.toLowerCase().includes('fat loss'));
});

test('choosePrimaryModelResponse ignores product-image labels for text coaching prompts', () => {
  const outputs = [
    { source: 'aichatbot', text: 'HEALTHY HABIT PLAN' },
    { source: 'nutrition_pipeline', text: 'MAINTENANCE' },
    { source: '28kproductimage', text: 'GREEK YOGURT PLAIN' }
  ];

  const result = choosePrimaryModelResponse(outputs, {
    intent: 'recovery',
    cues: ['sleep', 'recovery'],
    score: { recovery: 2, nutrition: 0, workout: 0, wellness: 0, lifestyle: 0, general: 0 },
    isComparison: false,
    isPlanRequest: false,
    urgentConcern: false
  });

  assert.ok(!String(result || '').toUpperCase().includes('GREEK YOGURT PLAIN'));
});
