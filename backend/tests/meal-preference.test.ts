import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  getMealSlotPreference,
  normalizeFoodPreference,
  isMealEligibleForPreference,
} from '../src/utils/foodPreference.ts';

describe('Meal preference logic', () => {
  it('normalizes veg and mixed preferences reliably', () => {
    assert.equal(normalizeFoodPreference('veg'), 'Vegetarian');
    assert.equal(normalizeFoodPreference('NON-VEG'), 'Non-Vegetarian');
    assert.equal(normalizeFoodPreference('mixed'), 'Mixed');
  });

  it('keeps veg users fully vegetarian across slots', () => {
    const slots = ['Breakfast', 'Lunch', 'Snack', 'Dinner'];
    const plan = slots.map((mealType) => getMealSlotPreference('Vegetarian', 0, mealType));
    assert.deepEqual(plan, ['Vegetarian', 'Vegetarian', 'Vegetarian', 'Vegetarian']);
  });

  it('does not lock non-veg users to all non-veg meals', () => {
    const goal = ['Breakfast', 'Lunch', 'Snack', 'Dinner'].map((slot) => getMealSlotPreference('Non-Vegetarian', 0, slot));
    assert.ok(goal.includes('Vegetarian'));
    assert.ok(goal.includes('Non-Vegetarian'));
  });

  it('allows mixed users to include both veg and non-veg items', () => {
    const goal = ['Breakfast', 'Lunch', 'Snack', 'Dinner'].map((slot) => getMealSlotPreference('Mixed', 1, slot));
    assert.ok(goal.includes('Vegetarian'));
    assert.ok(goal.includes('Non-Vegetarian'));
  });

  it('classifies common items correctly', () => {
    assert.equal(isMealEligibleForPreference({ name: 'Idli with Sambar', diet: 'Vegetarian' }, 'Vegetarian'), true);
    assert.equal(isMealEligibleForPreference({ name: 'Chicken Biryani', diet: 'Non-Vegetarian' }, 'Vegetarian'), false);
    assert.equal(isMealEligibleForPreference({ name: 'Fish Curry', diet: 'Non-Vegetarian' }, 'Non-Vegetarian'), true);
    assert.equal(isMealEligibleForPreference({ name: 'Paneer Curry', diet: 'Vegetarian' }, 'Non-Vegetarian'), true);
  });
});
