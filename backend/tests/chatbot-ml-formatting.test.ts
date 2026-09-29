import test from 'node:test';
import assert from 'node:assert/strict';
import { formatModelResponse } from '../src/controllers/chatbotController.ts';

test('formatModelResponse returns a concise sentence for sentence intent', () => {
  const response = 'This model answer provides a clear recommendation about hydration. It should be shorter when the user asks a simple question.';
  const output = formatModelResponse(response, 'sentence', 'How much water should I drink?', {
    intent: 'wellness',
    cues: ['water'],
    score: { recovery: 0, nutrition: 0, workout: 0, wellness: 1, lifestyle: 0, general: 0 },
    isComparison: false,
    isPlanRequest: false,
    urgentConcern: false
  }, {});

  assert.ok(output.length < 180, 'Sentence response should remain concise');
  assert.ok(output.includes('hydration') || output.includes('water'), 'Should preserve key topic words');
});

test('formatModelResponse returns bulleted text for bullets format', () => {
  const response = 'Eat whole foods. Stay hydrated. Sleep well. Manage stress with small habits.';
  const output = formatModelResponse(response, 'bullets', 'How can I improve recovery?', {
    intent: 'recovery',
    cues: ['sleep'],
    score: { recovery: 1, nutrition: 0, workout: 0, wellness: 0, lifestyle: 0, general: 0 },
    isComparison: false,
    isPlanRequest: false,
    urgentConcern: false
  }, {});

  assert.ok(output.startsWith('- '), 'Bullets output should begin with bullet markers');
  assert.ok(output.includes('\n'), 'Bullets output should contain multiple lines');
});
