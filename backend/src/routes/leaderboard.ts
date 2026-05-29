import { randomUUID } from 'crypto';
import type { Express } from 'express';
import type { Leaderboard, CreateLeaderboardResult } from '../../../interfaces/main';
import { authenticate, parseBody } from '../lib/auth';
import { getFirestore, firebaseApp, getDBUser } from '../lib/firebase';

export const registerRoutes = (app: Express) => {
  app.post('/create-leaderboard', async (req, res) => {
    const authResult = await authenticate(req, res);
    if (!authResult.success) return authResult.result;

    const { uid: callerUID } = authResult.result;

    const { name: rawName } = parseBody(req.body);

    const name = typeof rawName === 'string' ? rawName.trim() : '';

    if (!name || name.length > 50) {
      return res.status(400).json({ error: 'Name must be 1-50 characters', result: false });
    }

    const leaderboardDoc = getFirestore(firebaseApp).collection('leaderboards').doc();

    const joinToken = randomUUID();

    const leaderboard: Leaderboard = {
      id: leaderboardDoc.id,
      name,
      members: [callerUID],
      creator: callerUID,
      joinToken,
    };

    await leaderboardDoc.set(leaderboard);

    const currentUser = (await getDBUser(callerUID).get()).data() as { leaderboards: string[] };

    if (currentUser) {
      await getDBUser(callerUID).set({
        ...currentUser,
        leaderboards: [...currentUser?.leaderboards, leaderboardDoc.id],
      });
    } else {
      await getDBUser(callerUID).set({ leaderboards: [leaderboardDoc.id] });
    }

    const response: CreateLeaderboardResult = { success: true, uid: leaderboardDoc.id, name };

    return res.json(response);
  });

  app.get('/leaderboard', async (req, res) => {
    const authResult = await authenticate(req, res);
    if (!authResult.success) return authResult.result;

    const { uid: callerUID, admin: isAdmin } = authResult.result;
    const leaderboardId = req.query.leaderboardId as string;

    const leaderboard = (
      await getFirestore(firebaseApp).collection('leaderboards').doc(leaderboardId).get()
    ).data() as Leaderboard;

    if (!leaderboard) return res.status(404).json({ error: 'Leaderboard not found' });

    if (!isAdmin && (!Array.isArray(leaderboard.members) || !leaderboard.members.includes(callerUID))) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    return res.json(leaderboard);
  });

  app.post('/leaderboard', async (req, res) => {
    const authResult = await authenticate(req, res);
    if (!authResult.success) return authResult.result;

    const { uid: callerUID } = authResult.result;

    const leaderboardId = req.query.leaderboardId as string;
    const { joinToken } = parseBody(req.body);

    const leaderboard = (
      await getFirestore(firebaseApp).collection('leaderboards').doc(leaderboardId).get()
    ).data() as Leaderboard;

    if (!leaderboard) {
      return res.status(404).json({ error: 'Leaderboard not found' });
    }

    if (leaderboard.joinToken && leaderboard.joinToken !== joinToken) {
      return res.status(403).json({ error: 'Invalid invite token' });
    }

    if (!leaderboard.members.includes(callerUID)) {
      await getFirestore(firebaseApp)
        .collection('leaderboards')
        .doc(leaderboardId)
        .set({ ...leaderboard, members: [...leaderboard.members, callerUID] });

      const userExtraInfo = (await getDBUser(callerUID).get()).data();

      await getDBUser(callerUID).set({
        ...(userExtraInfo ?? {}),
        leaderboards: [...(userExtraInfo?.leaderboards ?? []), leaderboardId],
      });

      return res.json({ success: true });
    }
    return res.json({ success: true });
  });

  app.get('/leaderboards', async (req, res) => {
    const authResult = await authenticate(req, res);
    if (!authResult.success) return authResult.result;

    const { uid: callerUID, admin: isAdmin } = authResult.result;
    const snapshot = await getFirestore(firebaseApp).collection('leaderboards').get();
    const allLeaderboards = snapshot.docs.map(doc => doc.data());
    const data = isAdmin
      ? allLeaderboards
      : allLeaderboards.filter(lb => Array.isArray(lb.members) && lb.members.includes(callerUID));
    return res.json({ success: true, data });
  });

  app.post('/migrate-leaderboard-tokens', async (req, res) => {
    const authResult = await authenticate(req, res, true);
    if (!authResult.success) return authResult.result;

    const snapshot = await getFirestore(firebaseApp).collection('leaderboards').get();
    let updated = 0;

    for (const doc of snapshot.docs) {
      const data = doc.data() as Leaderboard;
      if (!data.joinToken) {
        await doc.ref.update({ joinToken: randomUUID() });
        updated++;
      }
    }

    return res.json({ success: true, updated });
  });

  app.delete('/leaderboard', async (req, res) => {
    const authResult = await authenticate(req, res, true);
    if (!authResult.success) return authResult.result;

    const { leaderboardId } = parseBody(req.body);

    const leaderboardDoc = getFirestore(firebaseApp).collection('leaderboards').doc(leaderboardId);

    const doc = await leaderboardDoc.get();
    if (!doc.exists) return res.status(404).json({ error: 'Leaderboard not found' });

    const leaderboard = doc.data() as Leaderboard;

    await leaderboardDoc.delete();

    for (const member of leaderboard.members) {
      const currentUser = (await getDBUser(member).get()).data() as { leaderboards: string[] };
      if (currentUser) {
        const leaderboards = currentUser.leaderboards.filter(l => l !== leaderboardId);
        await getDBUser(member).set({ ...currentUser, leaderboards });
      }
    }

    return res.json({ success: true });
  });
};
