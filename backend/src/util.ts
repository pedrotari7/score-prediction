import { Prediction, Result } from '../../interfaces/main';

export const isNum = (n: number): boolean => typeof n === 'number';

export const getOutcome = (g: Result): string | null => {
  if (!isNum(g.home) || !isNum(g.away)) return null;
  if (g.home > g.away) return 'winH';
  if (g.home < g.away) return 'winA';
  if (g.home === g.away) return 'draw';
  return null;
};

export const getResult = (prediction: Prediction, result: Result): number => {
  const { home: predH, away: predA } = prediction;
  const { home: realH, away: realA } = result;

  const isExactScore = predH === realH && predA === realA;

  if (isExactScore) return 5;

  const isCorrectResult =
    !isExactScore && getOutcome(prediction) !== null && getOutcome(prediction) === getOutcome(result);

  if (isCorrectResult) return 3;

  const isCorrectGoal = !isExactScore && !isCorrectResult && (predH === realH || predA === realA);

  if (isCorrectGoal) return 1;

  return 0;
};
