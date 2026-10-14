export const MAX_COMPARE = 5;


export const BUDGET_BOUNDS = { minLakh: 3, maxLakh: 300, stepLakh: 0.5 } as const;

export const KM_BOUNDS = { min: 1000, max: 60000 } as const;

/** Representative ownership length used by cost estimates for each questionnaire band. */
export const OWNERSHIP_YEARS: Record<string, number> = {
  "1-3": 2,
  "3-5": 4,
  "5-8": 6,
  "8+": 10,
};

export const APP_NAME = "Pitstop AI";
export const TAGLINE = "We are there to assist you in choosing your Dream Car.";
