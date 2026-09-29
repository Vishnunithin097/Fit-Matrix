import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { getWorkoutProgressState, advanceWorkoutDay } from '../src/utils/workoutProgress.ts';

describe('Workout progression', () => {
  it('keeps the user on the current day until completion', () => {
    const state = getWorkoutProgressState({ currentDay: 1, completedExercises: 1, totalExercises: 3 });
    assert.equal(state.currentDay, 1);
    assert.equal(state.progressPercent, 33);
  });

  it('advances to the next day only after workout completion', () => {
    const state = advanceWorkoutDay({ currentDay: 1, completedExercises: 3, totalExercises: 3 });
    assert.equal(state.currentDay, 2);
    assert.equal(state.progressPercent, 0);
  });

  it('preserves active day on reload when percent is mid-way', () => {
    const state = getWorkoutProgressState({ currentDay: 3, completedExercises: 2, totalExercises: 4 });
    assert.equal(state.currentDay, 3);
    assert.equal(state.progressPercent, 50);
  });
});
