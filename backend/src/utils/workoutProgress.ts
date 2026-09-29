export interface WorkoutProgressState {
  currentDay: number;
  completedExercises: number;
  totalExercises: number;
  progressPercent: number;
  completed: boolean;
}

export function getWorkoutProgressState({
  currentDay = 1,
  completedExercises = 0,
  totalExercises = 3,
}: {
  currentDay?: number;
  completedExercises?: number;
  totalExercises?: number;
}): WorkoutProgressState {
  const safeCurrentDay = Math.max(1, Number(currentDay) || 1);
  const safeTotal = Math.max(1, Number(totalExercises) || 1);
  const safeCompleted = Math.min(Math.max(0, Number(completedExercises) || 0), safeTotal);
  const progressPercent = Math.round((safeCompleted / safeTotal) * 100);

  return {
    currentDay: safeCurrentDay,
    completedExercises: safeCompleted,
    totalExercises: safeTotal,
    progressPercent,
    completed: progressPercent >= 100,
  };
}

export function advanceWorkoutDay({
  currentDay = 1,
  completedExercises = 0,
  totalExercises = 3,
}: {
  currentDay?: number;
  completedExercises?: number;
  totalExercises?: number;
}): WorkoutProgressState {
  const state = getWorkoutProgressState({ currentDay, completedExercises, totalExercises });

  if (!state.completed) {
    return state;
  }

  return {
    currentDay: safeCurrentDay(state.currentDay + 1),
    completedExercises: 0,
    totalExercises: state.totalExercises,
    progressPercent: 0,
    completed: false,
  };
}

function safeCurrentDay(value: number): number {
  return Math.max(1, Number(value) || 1);
}
