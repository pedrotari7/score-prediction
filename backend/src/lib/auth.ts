import type { DecodedIdToken } from 'firebase-admin/auth';
import type { Request, Response } from 'express';
import type { Competition } from '../../../interfaces/main';
import { getAuth, firebaseApp } from './firebase';
import { competitions, currentCompetition } from '../../../shared/utils';

export const decodeToken = async (raw: string | undefined) => {
  if (!raw) return;
  const token = raw.startsWith('Bearer ') ? raw.slice(7) : raw;
  try {
    return await getAuth(firebaseApp).verifyIdToken(token);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return;
  }
};

export const success = (result: DecodedIdToken) => ({ success: true, result }) as const;

export const fail = (result: Response<{ success: boolean; result: Record<string, Record<string, string>> }>) =>
  ({ success: false, result }) as const;

export const authenticate = async (req: Request, res: Response, needsAdmin = false) => {
  if (!req.headers.authorization) {
    return fail(res.status(401).json({ error: 'No credentials sent!' }));
  }

  const decodedToken = await decodeToken(req.headers.authorization);

  if (!decodedToken) return fail(res.status(401).json({ error: 'Invalid Token' }));

  if (needsAdmin && !decodedToken.admin) return fail(res.status(403).json({ error: 'Forbidden' }));

  return success(decodedToken);
};

export const parseBody = (body: unknown) => (typeof body === 'string' ? JSON.parse(body) : (body ?? {}));

export const parseCompetition = (req: Request): Competition =>
  competitions[req.query.competition as keyof typeof competitions] || currentCompetition;
