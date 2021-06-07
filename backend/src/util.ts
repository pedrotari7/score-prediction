import { Prediction, Result, UserResult } from '../../interfaces/main';

export const isNum = (n: number): boolean => typeof n === 'number';

export const getOutcome = (g: Result): string | null => {
  if (!isNum(g.home) || !isNum(g.away)) return null;
  if (g.home > g.away) return 'winH';
  if (g.home < g.away) return 'winA';
  if (g.home === g.away) return 'draw';
  return null;
};

export const getResult = (prediction: Prediction, result: Result): Partial<UserResult> => {
  const { home: predH, away: predA } = prediction;
  const { home: realH, away: realA } = result;

  const isExactScore = predH === realH && predA === realA;

  if (isExactScore) return { points: 5, exact: 1 };

  const isCorrectResult =
    !isExactScore && getOutcome(prediction) !== null && getOutcome(prediction) === getOutcome(result);

  if (isCorrectResult) return { points: 3, result: 1 };

  const isCorrectGoal = !isExactScore && !isCorrectResult && (predH === realH || predA === realA);

  if (isCorrectGoal) return { points: 1, onescore: 1 };

  return { points: 0, fail: 1 };
};

export const joinResults = (a: Partial<UserResult>, b: Partial<UserResult>): UserResult => {
  const result = { ...DEFAULT_USER_RESULT };
  for (const k in result) {
    result[k] += (a[k] ?? 0) + (b[k] ?? 0);
  }
  return result;
};

export const DEFAULT_USER_RESULT: UserResult = { points: 0, exact: 0, result: 0, onescore: 0, fail: 0, groups: 0 };
