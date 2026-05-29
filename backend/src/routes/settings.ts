import type { Express } from 'express';
import type { Settings } from '../../../interfaces/main';
import { authenticate, parseBody } from '../lib/auth';
import { getDBSettings, getDBUser } from '../lib/firebase';

export const registerRoutes = (app: Express) => {
  app.get('/settings', async (req, res) => {
    const authResult = await authenticate(req, res, true);
    if (!authResult.success) return authResult.result;

    const settingsDoc = await getDBSettings().get();
    if (!settingsDoc.exists) return res.status(500).json({ error: 'Missing settings' });

    return res.json(settingsDoc.data() as Settings);
  });

  app.post('/update-settings', async (req, res) => {
    const authResult = await authenticate(req, res, true);
    if (!authResult.success) return authResult.result;

    const { settings } = parseBody(req.body);

    const ALLOWED_KEYS = [
      'adminHideScores',
      'allowUpdateFixtures',
      'allowUpdateStandings',
      'disableLiveScoresApi',
      'allowUpdatePoints',
    ] as const;
    const validated = Object.fromEntries(ALLOWED_KEYS.map(k => [k, Boolean(settings?.[k])]));

    const result = await getDBSettings().set(validated);

    return res.json(result);
  });

  app.post('/no-spoilers', async (req, res) => {
    const authResult = await authenticate(req, res);
    if (!authResult.success) return authResult.result;

    const { uid: callerUID } = authResult.result;

    const { noSpoilers } = parseBody(req.body);

    await getDBUser(callerUID).update({ noSpoilers });

    return res.json({ success: true });
  });
};
