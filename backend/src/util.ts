import { UserResult } from '../../interfaces/main';

export const joinResults = (a: Partial<UserResult>, b: Partial<UserResult>): UserResult => {
  const result = { ...DEFAULT_USER_RESULT };
  for (const k in result) {
    result[k] += (a[k] ?? 0) + (b[k] ?? 0);
  }
  return result;
};

export const DEFAULT_USER_RESULT: UserResult = { points: 0, exact: 0, result: 0, onescore: 0, fail: 0, groups: 0 };
