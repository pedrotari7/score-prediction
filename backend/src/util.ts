import type { UserResult } from '../../interfaces/main';
import { DEFAULT_USER_RESULT } from '../../shared/utils';

export const joinResults = (a: Partial<UserResult>, b: Partial<UserResult>): UserResult => {
  const result = { ...DEFAULT_USER_RESULT };
  for (const k in result) {
    result[k] += (a?.[k] ?? 0) + (b?.[k] ?? 0);
  }
  return result;
};
