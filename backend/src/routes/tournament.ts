/* eslint-disable @stylistic/ts/indent */

import type { Express } from 'express';
import type {
  Boosts,
  Fixture,
  FixtureOdds,
  Fixtures,
  Leaderboard,
  Predictions,
  Settings,
  Standing,
  Tournament,
} from '../../../interfaces/main';
import {
  competitions,
  currentCompetitions,
  getGameStage,
  getMaxBoostsForStage,
  isGameOnGoing,
  isGameStarted,
} from '../../../shared/utils';
import { authenticate, decodeToken, parseBody, parseCompetition } from '../lib/auth';
import {
  FieldValue,
  getAuth,
  getFirestore,
  Timestamp,
  firebaseApp,
  getDBFixtures,
  getDBBoosts,
  getDBReactions,
  getDBFixturesExtraInfo,
  getDBOdds,
  getDBPredictions,
  getDBSettings,
  getDBStandings,
  getDBUser,
  getDbDoc,
  listAllUsers,
  updateLastCheckIn,
} from '../lib/firebase';
import { getStatus } from '../lib/api-sports';
import {
  getCurrentTime,
  getTimeDiff,
  getUsers,
  getPredictions,
  GAME_TIME,
  ODDS_STALE_TIME,
  STALE_TIME,
  updateFixtures,
  updateGroups,
  updateOdds,
  updatePoints,
  updateStandings,
} from '../services/tournament';

export const registerRoutes = (app: Express) => {
  app.get('/health', (_, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.post('/update-fixture-score', async (req, res) => {
    const authResult = await authenticate(req, res, true);
    if (!authResult.success) return authResult.result;

    const competition = parseCompetition(req);
    const { gameId, home, away, status } = parseBody(req.body);

    const parsedGameId = Number(gameId);
    if (!Number.isInteger(parsedGameId) || parsedGameId <= 0) {
      return res.status(400).json({ error: 'Invalid gameId' });
    }
    if (typeof home !== 'number' || typeof away !== 'number') {
      return res.status(400).json({ error: 'home and away must be numbers' });
    }

    const fixturesDoc = await getDBFixtures(competition).get();
    if (!fixturesDoc.exists) return res.status(500).json({ error: 'Missing fixtures' });

    const fixtures = fixturesDoc.data()?.data as Fixtures;
    if (!fixtures[parsedGameId]) return res.status(404).json({ error: 'Game not found' });

    fixtures[parsedGameId].goals = { home, away };
    if (status) fixtures[parsedGameId].fixture.status.short = status;
    fixtures[parsedGameId].score.fulltime = { home, away };

    await getDBFixtures(competition).set({ data: fixtures, timestamp: FieldValue.serverTimestamp() });

    return res.json({ success: true });
  });

  app.get('/tournament', async (req, res) => {
    const authResult = await authenticate(req, res);
    if (!authResult.success) return authResult.result;

    if (!authResult.result) return res.json({});

    const decodedToken = authResult.result;

    const competition = parseCompetition(req);

    const hasUpset = (competition.points.upset ?? 0) > 0;

    // Fetch all initial data in parallel instead of sequentially
    const [settingsDoc, fixturesDocument, standingsDocument, oddsDocument, boostsDocument] = await Promise.all([
      getDBSettings().get(),
      getDBFixtures(competition).get(),
      getDBStandings(competition).get(),
      hasUpset ? getDBOdds(competition).get() : Promise.resolve(null),
      getDBBoosts(competition).get(),
    ]);

    if (!settingsDoc.exists) return res.status(500).json({ error: 'Missing settings' });

    const settings = settingsDoc.data() as Settings;
    let fixtures = fixturesDocument.data();
    let standings = standingsDocument.data();

    // Must await when data is completely absent — no cache to serve
    if (!fixtures?.data && !settings.disableLiveScoresApi) {
      console.log('There are no current fixtures');
      fixtures = await updateFixtures(competition, [], {});
    }

    if (!standings && !settings.disableLiveScoresApi) {
      console.log('There are no current standings');
      const newStandings = await updateStandings(competition);
      if (newStandings) standings = { data: newStandings };
    }

    const fixturesTimeDiffSeconds = getTimeDiff(fixtures?.timestamp);
    const standingsTimeDiffSeconds = getTimeDiff(standings?.timestamp);

    const hasGamesOngoing = Object.values<Fixture>(fixtures?.data ?? {}).some(g => isGameOnGoing(g));

    const currentDate = getCurrentTime().getTime();

    const hasNonStartedGames = Object.values<Fixture>(fixtures?.data ?? {})
      .filter(g => !isGameStarted(g))
      .some(g => (currentDate - new Date(g?.fixture?.date).getTime()) / 1000 > 0);

    const timeGuard = hasGamesOngoing || hasNonStartedGames ? GAME_TIME : STALE_TIME;

    // Fire stale updates in the background — serve cached data now, next visit gets fresh data
    if (!settings.disableLiveScoresApi && (settings.allowUpdateStandings || standingsTimeDiffSeconds > timeGuard)) {
      console.log('standings needs update (background)');
      void updateStandings(competition).catch(e => console.error('Background standings update failed:', e));
    }

    if (!settings.disableLiveScoresApi && (settings.allowUpdateFixtures || fixturesTimeDiffSeconds > timeGuard)) {
      console.log('fixtures needs update (background)');

      const gamesToUpdate = hasGamesOngoing
        ? Object.values(fixtures?.data as Fixtures)
            .filter(f => isGameOnGoing(f))
            .map(f => f.fixture.id)
        : [];

      void updateFixtures(competition, gamesToUpdate, fixtures?.data).catch(e =>
        console.error('Background fixtures update failed:', e)
      );
    }

    if (!settings.disableLiveScoresApi && hasUpset) {
      const oddsTimeDiffSeconds = oddsDocument?.exists ? getTimeDiff(oddsDocument.data()?.timestamp) : Infinity;
      if (oddsTimeDiffSeconds > ODDS_STALE_TIME) {
        console.log('odds needs update (background)');
        void updateOdds(competition, fixtures?.data).catch(e => console.error('Background odds update failed:', e));
      }
    }

    // Parallelize the independent fetches: predictions, user profile, and all users
    const [predictions, userExtraInfoDoc, users] = await Promise.all([
      getPredictions(decodedToken, competition, fixtures?.data, settings),
      getDBUser(decodedToken.uid).get(),
      getUsers(competition, undefined, decodedToken.uid),
    ]);

    // Fire points recalculation in background — getUsers already read cached scores above
    if (fixturesTimeDiffSeconds > timeGuard || settings.allowUpdatePoints) {
      console.log('will update points (background)');
      void updatePoints(competition, predictions, fixtures?.data).catch(e =>
        console.error('Background points update failed:', e)
      );
    }

    const userExtraInfo = userExtraInfoDoc.data() ?? { leaderboards: [] };

    const email = decodedToken.email;
    if (email) {
      const domain = email.split('@')[1];
      if (domain) {
        const autoJoinSnapshot = await getFirestore(firebaseApp)
          .collection('leaderboards')
          .where('emailDomain', '==', domain)
          .get();

        for (const doc of autoJoinSnapshot.docs) {
          const lb = doc.data() as Leaderboard;
          if (!lb.members.includes(decodedToken.uid)) {
            await Promise.all([
              doc.ref.update({ members: FieldValue.arrayUnion(decodedToken.uid) }),
              getDBUser(decodedToken.uid).set({ leaderboards: FieldValue.arrayUnion(doc.id) }, { merge: true }),
            ]);
            if (!userExtraInfo.leaderboards) userExtraInfo.leaderboards = [];
            userExtraInfo.leaderboards.push(doc.id);
          }
        }
      }
    }

    const leaderboards: Record<string, Leaderboard> = (
      await Promise.all<Leaderboard>(
        (userExtraInfo?.leaderboards ?? []).map(async (l: string) =>
          (await getFirestore(firebaseApp).collection('leaderboards').doc(l).get()).data()
        )
      )
    ).reduce((acc, l) => ({ ...acc, [l.id]: l }), {});

    const odds: FixtureOdds | undefined = oddsDocument?.exists ? (oddsDocument.data()?.data as FixtureOdds) : undefined;
    const boosts: Boosts | undefined = boostsDocument?.exists ? (boostsDocument.data() as Boosts) : undefined;

    const tournament: Tournament = {
      fixtures: fixtures?.data,
      standings: standings?.data,
      predictions,
      users,
      userExtraInfo: { noSpoilers: false, ...userExtraInfo, leaderboards },
      ...(odds && { odds }),
      ...(boosts && { boosts }),
    };

    void getDBUser(decodedToken.uid)
      .set({ lastCheckIn: FieldValue.serverTimestamp() }, { merge: true })
      .catch(e => console.error('Background lastCheckIn update failed:', e));

    const isHistorical = !currentCompetitions.some(c => c.name === competition.name);
    if (isHistorical) {
      res.set('Cache-Control', 'public, max-age=86400');
    } else if (hasGamesOngoing) {
      res.set('Cache-Control', 'no-store');
    } else {
      res.set('Cache-Control', 'private, no-cache');
    }
    return res.json(tournament);
  });

  app.get('/fetch-standings', async (req, res) => {
    const authResult = await authenticate(req, res, true);
    if (!authResult.success) return authResult.result;

    const competition = parseCompetition(req);

    const data = await updateStandings(competition);

    return res.json(data);
  });

  app.get('/fetch-fixtures', async (req, res) => {
    const authResult = await authenticate(req, res, true);
    if (!authResult.success) return authResult.result;

    const competition = parseCompetition(req);

    const fixtures = (await getDBFixtures(competition).get()).data()?.data as Fixtures;

    const data = await updateFixtures(competition, [], fixtures);

    return res.json(data);
  });

  app.get('/fetch-predictions', async (req, res) => {
    const authResult = await authenticate(req, res, true);
    if (!authResult.success) return authResult.result;

    const competition = parseCompetition(req);

    const [fixturesDoc, settingsDoc] = await Promise.all([getDBFixtures(competition).get(), getDBSettings().get()]);

    if (!fixturesDoc.exists || !settingsDoc.exists) {
      return res.status(500).json({ error: 'Missing competition data' });
    }

    const fixtures = fixturesDoc.data()?.data as Fixtures;
    const settings = settingsDoc.data() as Settings;

    const predictions = await getPredictions(authResult.result, competition, fixtures, settings);

    return res.json(predictions);
  });

  app.get('/fetch-status', async (req, res) => {
    const authResult = await authenticate(req, res, true);
    if (!authResult.success) return authResult.result;

    const status = await getStatus();

    return res.json(status);
  });

  app.get('/fetch-users', async (req, res) => {
    const authResult = await authenticate(req, res, true);
    if (!authResult.success) return authResult.result;

    const authUsers = await listAllUsers();
    const userRefs = authUsers.map(u => getDBUser(u.uid));
    const userDocs = await getFirestore(firebaseApp).getAll(...userRefs);
    const userDataMap = Object.fromEntries(userDocs.map(d => [d.id, d.data() ?? { leaderboards: [] }]));

    const allUsers = authUsers
      .map(({ displayName, metadata, uid, photoURL, email }) => ({
        displayName,
        uid,
        photoURL,
        email: email?.replace(/(.{2}).+(@.+)/, '$1***$2'),
        userExtraInfo: userDataMap[uid] ?? { leaderboards: [] },
        ...metadata,
      }))
      .sort((a, b) => {
        if (a.userExtraInfo.lastCheckIn && b.userExtraInfo.lastCheckIn) {
          const ta = new Timestamp(a.userExtraInfo?.lastCheckIn._seconds, a.userExtraInfo?.lastCheckIn._nanoseconds);
          const tb = new Timestamp(b.userExtraInfo?.lastCheckIn._seconds, b.userExtraInfo?.lastCheckIn._nanoseconds);
          return tb.toMillis() - ta.toMillis();
        } else if (a.userExtraInfo.lastCheckIn && !b.userExtraInfo.lastCheckIn) {
          return -1;
        } else if (!a.userExtraInfo.lastCheckIn && b.userExtraInfo.lastCheckIn) {
          return 1;
        }
        return new Date(b.lastSignInTime).getTime() - new Date(a.lastSignInTime).getTime();
      });

    return res.json({ success: true, data: allUsers });
  });

  app.post('/update-predictions', async (req, res) => {
    const authResult = await authenticate(req, res);

    if (!authResult.success) return authResult.result;

    const decodedToken = authResult.result;

    updateLastCheckIn(decodedToken.uid);

    const { uid: callerUID } = authResult.result;

    const { gameId, prediction } = parseBody(req.body);

    const parsedGameId = Number(gameId);
    if (!Number.isInteger(parsedGameId) || parsedGameId <= 0) {
      return res.status(400).json({ error: 'Invalid gameId', result: false });
    }

    const isValidScore = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= 99;

    const home = prediction?.home ?? null;
    const away = prediction?.away ?? null;

    if (home !== null && !isValidScore(home))
      return res.status(400).json({ error: 'Invalid home score', result: false });
    if (away !== null && !isValidScore(away))
      return res.status(400).json({ error: 'Invalid away score', result: false });

    const competition = parseCompetition(req);

    const fixtures = (await getDBFixtures(competition).get()).data()?.data as Fixtures;

    if (!fixtures?.[parsedGameId]) {
      return res.status(404).json({ error: 'Game not found', result: false });
    }

    const gameDate = new Date(fixtures[parsedGameId].fixture.date);

    const isInFuture = gameDate && getCurrentTime() < gameDate;

    if (!isInFuture) return res.status(403).json({ error: 'Forbidden', result: false });

    const change = { [`${parsedGameId}.${callerUID}`]: { home, away } };

    const result = await getFirestore(firebaseApp).collection(competition.name).doc('predictions').update(change);

    return res.json({ ...result, success: true });
  });

  app.post('/update-boost', async (req, res) => {
    const authResult = await authenticate(req, res);
    if (!authResult.success) return authResult.result;

    const { uid: callerUID } = authResult.result;
    const { gameId } = parseBody(req.body);

    const parsedGameId = Number(gameId);
    if (!Number.isInteger(parsedGameId) || parsedGameId <= 0) {
      return res.status(400).json({ error: 'Invalid gameId', result: false });
    }

    const competition = parseCompetition(req);

    const fixtures = (await getDBFixtures(competition).get()).data()?.data as Fixtures;
    if (!fixtures?.[parsedGameId]) {
      return res.status(404).json({ error: 'Game not found', result: false });
    }

    const gameDate = new Date(fixtures[parsedGameId].fixture.date);
    if (getCurrentTime() >= gameDate) {
      return res.status(403).json({ error: 'Game already started', result: false });
    }

    const boostsDoc = await getDBBoosts(competition).get();
    const allBoosts = (boostsDoc.exists ? boostsDoc.data() : {}) as Record<string, number[]>;
    const userBoosts = allBoosts[callerUID] ?? [];

    const idx = userBoosts.indexOf(parsedGameId);
    if (idx >= 0) {
      userBoosts.splice(idx, 1);
    } else {
      const game = fixtures[parsedGameId];
      const stage = getGameStage(game);
      const maxForStage = getMaxBoostsForStage(competition, stage);
      const usedInStage = userBoosts.filter(id => fixtures[id] && getGameStage(fixtures[id]) === stage).length;
      if (usedInStage >= maxForStage) {
        return res.status(400).json({ error: 'Maximum boosts reached for this stage', result: false });
      }
      userBoosts.push(parsedGameId);
    }

    allBoosts[callerUID] = userBoosts;
    await getDBBoosts(competition).set(allBoosts);

    return res.json({ success: true, boosts: userBoosts });
  });

  app.get('/reactions', async (req, res) => {
    const authResult = await authenticate(req, res);
    if (!authResult.success) return authResult.result;

    const competition = parseCompetition(req);
    const parsedGameId = Number(req.query.gameId);

    if (!Number.isInteger(parsedGameId) || parsedGameId <= 0) {
      return res.status(400).json({ error: 'Invalid gameId' });
    }

    const reactionsDoc = await getDBReactions(competition).get();
    const allReactions = reactionsDoc.exists ? (reactionsDoc.data() ?? {}) : {};

    return res.json({ reactions: allReactions[String(parsedGameId)] ?? {} });
  });

  app.post('/reactions', async (req, res) => {
    const authResult = await authenticate(req, res);
    if (!authResult.success) return authResult.result;

    const { uid: callerUID } = authResult.result;
    const { gameId, targetUid, emoji } = parseBody(req.body);

    const parsedGameId = Number(gameId);
    if (!Number.isInteger(parsedGameId) || parsedGameId <= 0) {
      return res.status(400).json({ error: 'Invalid gameId' });
    }
    if (typeof targetUid !== 'string' || !targetUid) {
      return res.status(400).json({ error: 'Invalid targetUid' });
    }
    if (typeof emoji !== 'string' || !emoji.trim()) {
      return res.status(400).json({ error: 'Invalid emoji' });
    }
    if (callerUID === targetUid) {
      return res.status(400).json({ error: 'Cannot react to your own prediction' });
    }

    const competition = parseCompetition(req);

    const fixtures = (await getDBFixtures(competition).get()).data()?.data as Fixtures;
    if (!fixtures?.[parsedGameId]) {
      return res.status(404).json({ error: 'Game not found' });
    }
    if (!isGameStarted(fixtures[parsedGameId])) {
      return res.status(403).json({ error: 'Game has not started yet' });
    }

    const reactionsDoc = await getDBReactions(competition).get();
    const allReactions = reactionsDoc.exists ? (reactionsDoc.data() ?? {}) : {};
    const gameKey = String(parsedGameId);
    const gameReactions = (allReactions[gameKey] ?? {}) as Record<string, Record<string, string[]>>;

    if (!gameReactions[callerUID]) gameReactions[callerUID] = {};
    const currentEmojis: string[] = gameReactions[callerUID][targetUid] ?? [];
    const idx = currentEmojis.indexOf(emoji);
    const updated = idx >= 0 ? currentEmojis.filter(e => e !== emoji) : [...currentEmojis, emoji];

    if (updated.length === 0) {
      delete gameReactions[callerUID][targetUid];
      if (Object.keys(gameReactions[callerUID]).length === 0) delete gameReactions[callerUID];
    } else {
      gameReactions[callerUID][targetUid] = updated;
    }

    allReactions[gameKey] = gameReactions;
    await getDBReactions(competition).set(allReactions);

    return res.json({ success: true });
  });

  app.get('/points', async (req, res) => {
    const authResult = await authenticate(req, res, true);
    if (!authResult.success) return authResult.result;

    const competition = parseCompetition(req);

    const [fixturesDoc, predictionsDoc] = await Promise.all([
      getDBFixtures(competition).get(),
      getDBPredictions(competition).get(),
    ]);

    if (!fixturesDoc.exists || !predictionsDoc.exists) {
      return res.status(500).json({ error: 'Missing competition data' });
    }

    const fixtures = fixturesDoc.data()?.data as Fixtures;
    const predictions = predictionsDoc.data() as Predictions;

    const points = await updatePoints(competition, predictions, fixtures);
    return res.json(points);
  });

  app.get('/groups', async (req, res) => {
    const authResult = await authenticate(req, res, true);
    if (!authResult.success) return authResult.result;

    const competition = parseCompetition(req);

    const [fixturesDoc, standingsDoc, predictionsDoc] = await Promise.all([
      getDBFixtures(competition).get(),
      getDBStandings(competition).get(),
      getDBPredictions(competition).get(),
    ]);

    if (!fixturesDoc.exists || !standingsDoc.exists || !predictionsDoc.exists) {
      return res.status(500).json({ error: 'Missing competition data' });
    }

    const fixtures = fixturesDoc.data()?.data as Fixtures;
    const standings = standingsDoc.data()?.data as Record<string, Standing[]>;
    const predictions = predictionsDoc.data() as Predictions;

    const groupPoints = await updateGroups(competition, predictions, fixtures, standings);

    return res.json(groupPoints);
  });

  app.get('/fetch-odds', async (req, res) => {
    const authResult = await authenticate(req, res, true);
    if (!authResult.success) return authResult.result;

    const competition = parseCompetition(req);

    const oddsDoc = await getDBOdds(competition).get();
    const odds = oddsDoc.exists ? (oddsDoc.data()?.data ?? {}) : {};

    return res.json(odds);
  });

  app.get('/fetch-odds-live', async (req, res) => {
    const authResult = await authenticate(req, res, true);
    if (!authResult.success) return authResult.result;

    const competition = parseCompetition(req);

    const fixturesDoc = await getDBFixtures(competition).get();
    if (!fixturesDoc.exists) return res.status(500).json({ error: 'Missing fixtures' });

    const fixtures = fixturesDoc.data()?.data as Fixtures;
    const odds = await updateOdds(competition, fixtures);

    return res.json(odds);
  });

  app.get('/fixture-extra', async (req, res) => {
    const authResult = await authenticate(req, res);
    if (!authResult.success) return authResult.result;

    const competition = parseCompetition(req);

    const gameID = parseInt(req.query.gameID as string, 10);
    if (!Number.isInteger(gameID) || gameID <= 0) {
      return res.status(400).json({ error: 'Invalid gameID' });
    }

    const extraDoc = await getDBFixturesExtraInfo(competition).collection(`${gameID}`).doc('extra').get();

    return res.json(extraDoc.exists ? extraDoc.data() : {});
  });

  app.get('/cleanup', async (req, res) => {
    const authResult = await authenticate(req, res, true);
    if (!authResult.success) return authResult.result;

    const allUsers = (await getAuth(firebaseApp).listUsers()).users.map(({ uid }) => uid);

    const competition = parseCompetition(req);

    const predictionsDoc = await getDBPredictions(competition).get();
    if (!predictionsDoc.exists) return res.status(500).json({ error: 'Missing predictions data' });

    const predictions = predictionsDoc.data() as Predictions;

    const cleanedPredictions = Object.fromEntries(
      Object.entries(predictions).map(([gameID, gamePredictions]) => {
        return [gameID, Object.fromEntries(Object.entries(gamePredictions).filter(([uid]) => allUsers.includes(uid)))];
      })
    );

    await getDBPredictions(competition).set(cleanedPredictions);

    return res.json({});
  });

  app.get('/validate-token', async (req, res) => {
    const decodedToken = await decodeToken(req.headers.authorization);

    if (!decodedToken) return res.json({ success: false, uid: '' });

    const { uid } = decodedToken;

    return res.json({ success: true, uid });
  });

  app.get('/missing-signups', async (req, res) => {
    const authResult = await authenticate(req, res, true);
    if (!authResult.success) return authResult.result;

    const competition = parseCompetition(req);

    const pastCompetitions = Object.values(competitions).filter(c => c.name !== competition.name);

    const [authUsers, predictionsDoc, ...pastPredictionsDocs] = await Promise.all([
      listAllUsers(),
      getDBPredictions(competition).get(),
      ...pastCompetitions.map(c => getDBPredictions(c).get()),
    ]);

    const predictions = (predictionsDoc.exists ? predictionsDoc.data() : {}) as Predictions;
    const signedUpUids = new Set(Object.values(predictions).flatMap(gamePredictions => Object.keys(gamePredictions)));

    const pastParticipation = new Map<string, string[]>();
    pastPredictionsDocs.forEach((doc, i) => {
      if (!doc.exists) return;
      const preds = doc.data() as Predictions;
      const uids = new Set(Object.values(preds).flatMap(gp => Object.keys(gp)));
      uids.forEach(uid => {
        if (!pastParticipation.has(uid)) pastParticipation.set(uid, []);
        pastParticipation.get(uid)!.push(pastCompetitions[i].name);
      });
    });

    const missing = authUsers
      .filter(u => !signedUpUids.has(u.uid))
      .map(({ uid, displayName, photoURL, email, metadata }) => ({
        uid,
        displayName,
        photoURL,
        email,
        lastSignInTime: metadata.lastSignInTime,
        creationTime: metadata.creationTime,
        participatedIn: pastParticipation.get(uid) ?? [],
      }))
      .sort((a, b) => new Date(b.lastSignInTime).getTime() - new Date(a.lastSignInTime).getTime());

    return res.json({
      success: true,
      total: authUsers.length,
      signedUp: signedUpUids.size,
      missing: missing.length,
      pastCompetitions: pastCompetitions.map(c => c.name),
      data: missing,
    });
  });

  app.post('/init-competition', async (req, res) => {
    const authResult = await authenticate(req, res, true);
    if (!authResult.success) return authResult.result;

    const competition = parseCompetition(req);

    const docs = ['predictions', 'scores', 'groupPoints', 'boosts'];
    const results: Record<string, string> = {};

    for (const doc of docs) {
      const ref = getDbDoc(competition, doc);
      const snapshot = await ref.get();
      if (snapshot.exists) {
        results[doc] = 'already exists';
      } else {
        await ref.set({});
        results[doc] = 'created';
      }
    }

    return res.json({ success: true, competition: competition.name, results });
  });
};
