export type FoodPreference = 'Vegetarian' | 'Non-Vegetarian' | 'Mixed';

export function parseFoodPreference(value: unknown): FoodPreference | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  if (
    /^(veg|vegetarian|vegan|plant based|plant-based|pure veg|pure-veg|vegetarian only)$/.test(normalized)
  ) {
    return 'Vegetarian';
  }

  if (
    /^(non[- ]?veg|non[- ]?vegetarian|nonveg|non vegetarian|omnivore|meat eater|meat-eater|meat)$/.test(normalized)
  ) {
    return 'Non-Vegetarian';
  }

  if (
    /^(mixed|both|both veg and non veg|veg and non veg|combo|mixed diet|mixed food|anything)$/.test(normalized)
  ) {
    return 'Mixed';
  }

  if (normalized.includes('veg') && normalized.includes('non')) {
    return 'Mixed';
  }

  if (normalized.includes('both')) {
    return 'Mixed';
  }

  return null;
}

export function normalizeFoodPreference(value: unknown): FoodPreference {
  return parseFoodPreference(value) ?? 'Vegetarian';
}
