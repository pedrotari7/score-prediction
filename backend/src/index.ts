/* eslint-disable @stylistic/ts/indent */

import { setGlobalOptions } from 'firebase-functions/v2';
import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';

// import { beforeUserCreated } from 'firebase-functions/v2/identity';

import { randomUUID } from 'crypto';
import { initializeApp } from 'firebase-admin/app';
import { FieldValue, Timestamp, getFirestore } from 'firebase-admin/firestore';
import type { DecodedIdToken, UserRecord } from 'firebase-admin/auth';
import { getAuth } from 'firebase-admin/auth';

import cors from 'cors';
import type { Request, Response } from 'express';
import express from 'express';
import axios from 'axios';

import type {
  Competition,
  CreateLeaderboardResult,
  Fixture,
  FixtureExtraInfo,
  Fixtures,
  GroupPoints,
  Leaderboard,
  Predictions,
  Settings,
  Standing,
  Status,
  Tournament,
  UserResult,
} from '../../interfaces/main';
import {
  calculateResults,
  calculateUserResultPoints,
  competitions,
  currentCompetition,
  currentCompetitions,
  DEFAULT_USER_RESULT,
  getResult,
  isGameOnGoing,
  isGameStarted,
  isGroupStage,
  isNum,
  joinResults,
  sortGroup,
  sortWorldCupGroup,
} from '../../shared/utils';

import { rateLimit } from 'express-rate-limit';

// High limit intentional — users were being rate limited during normal usage
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100000,
  validate: { xForwardedForHeader: false, ip: false },
});

const app = express();

// apply rate limiter to all requests
app.use(limiter);

const corsOrigins = [
  'https://score-prediction.com',
  'https://www.score-prediction.com',
  'https://score-prediction.vercel.app',
  ...(process.env.ISDEV ? ['http://localhost:3000', 'http://localhost:3001'] : []),
];

// CSRF: all state-changing endpoints require the Authorization header, which browsers
// won't attach to cross-origin simple requests, preventing CSRF without a dedicated token.
app.use(
  cors({
    origin: corsOrigins,
  })
);

const isDevMode = process.env.ISDEV;

setGlobalOptions({ region: 'europe-west1' });

const APISPORTSKEY = defineSecret('APISPORTS');

const firebaseApp = initializeApp();

const STALE_TIME = 60 * 60 * 4;
const GAME_TIME = 60 * 1;

const API_SPORTS_URL = 'https://v3.football.api-sports.io';

// const ADMIN_USERS = ['pedrotari7@gmail.com'];

const logDev = (message?: unknown, ...optionalParams: unknown[]): void => {
  if (isDevMode) console.log(message, optionalParams);
};

if (isDevMode) console.log('[hot-reload-test] Backend functions loaded at', new Date().toISOString());

const parseBody = (body: unknown) => (typeof body === 'string' ? JSON.parse(body) : (body ?? {}));

const buildUrl = (url: string, opts: Record<string, unknown>) =>
  url +
  '?' +
  Object.entries(opts)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');

const get = async (url: string, opts: Record<string, unknown> = {}) => {
  try {
    return (await axios.get(buildUrl(`${API_SPORTS_URL}/${url}`, opts), {
      headers: {
        'x-rapidapi-host': 'v3.football.api-sports.io',
        'x-rapidapi-key': APISPORTSKEY.value(),
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    })) as any;
  } catch (error: unknown) {
    console.error('API Sports request failed:', error);
    return { status: 0, data: { response: [] } };
  }
};

const parseCompetition = (req: Request) =>
  competitions[req.query.competition as keyof typeof competitions] || currentCompetition;

const getStandings = async (opts: Record<string, unknown> = {}) => await get('standings', opts);

const getFixtures = async (opts: Record<string, unknown> = {}) => await get('fixtures', opts);

const getStatus = async (): Promise<Status> => (await get('status')).data.response;

const getFullFixture = async (eventID: number, opts: Record<string, unknown> = {}): Promise<Fixture | null> => {
  const fullFixtures = await get('fixtures', { id: eventID, ...opts });

  if (fullFixtures.status !== 200) return null;
  return fullFixtures.data.response.pop();
};

const decodeToken = async (raw: string | undefined) => {
  if (!raw) return;
  const token = raw.startsWith('Bearer ') ? raw.slice(7) : raw;
  try {
    return await getAuth(firebaseApp).verifyIdToken(token);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return;
  }
};

const success = (result: DecodedIdToken) => ({ success: true, result }) as const;

const fail = (result: Response<{ success: boolean; result: Record<string, Record<string, string>> }>) =>
  ({ success: false, result }) as const;

const authenticate = async (req: Request, res: Response, needsAdmin = false) => {
  if (!req.headers.authorization) {
    return fail(res.status(401).json({ error: 'No credentials sent!' }));
  }

  const decodedToken = await decodeToken(req.headers.authorization);

  if (!decodedToken) return fail(res.status(401).json({ error: 'Invalid Token' }));

  if (needsAdmin && !decodedToken.admin) return fail(res.status(403).json({ error: 'Forbidden' }));

  return success(decodedToken);
};

const getCurrentTime = () => {
  return new Date();
  // Mocked date
  // return new Date('2022-12-20T17:00:00+0000');
  // return new Date('2021-06-11T19:00:00+0000');
  // return new Date('2016-06-09T19:00:00+0000');
};

const getTimeDiff = (timestamp: Timestamp) => {
  return (getCurrentTime().getTime() - timestamp?.toMillis()) / 1000;
};

const getDbDoc = (comp: Competition, name: string) => getFirestore(firebaseApp).collection(comp.name).doc(name);
const getDoc = (collection: string, name: string) => getFirestore(firebaseApp).collection(collection).doc(name);

const getDBFixtures = (competition: Competition) => getDbDoc(competition, 'fixtures');
const getDBFixturesExtraInfo = (competition: Competition) => getDbDoc(competition, 'fixturesExtraInfo');
const getDBStandings = (competition: Competition) => getDbDoc(competition, 'standings');
const getDBPredictions = (competition: Competition) => getDbDoc(competition, 'predictions');
const getDBScores = (competition: Competition) => getDbDoc(competition, 'scores');
const getDBGroupPoints = (competition: Competition) => getDbDoc(competition, 'groupPoints');
const getDBSettings = () => getDoc('admin', 'settings');
const getDBUser = (uid: string) => getDoc('users', uid);

const listAllUsers = async () => {
  const allUsers: UserRecord[] = [];
  let pageToken: string | undefined;
  do {
    const result = await getAuth(firebaseApp).listUsers(1000, pageToken);
    allUsers.push(...result.users);
    pageToken = result.pageToken;
  } while (pageToken);
  return allUsers;
};

const updateLastCheckIn = async (uid: string): Promise<void> => {
  await getDBUser(uid).set({ lastCheckIn: FieldValue.serverTimestamp() }, { merge: true });
};

const updateStandings = async (competition: Competition) => {
  const response = await getStandings({ league: competition.league, season: competition.season });

  if (response.status !== 200) return null;

  const standings =
    competition.name !== competitions.euro2016.name
      ? response.data.response?.[0]?.league.standings
      : response.data.response?.[0]?.league.standings[1];

  const standsObj =
    competition.name !== competitions.euro2016.name
      ? standings.reduce((acc: Record<string, unknown>, stand: Array<Standing>) => {
          return { ...acc, [stand[0].group]: stand };
        }, {})
      : standings.reduce((acc: Record<string, Standing[]>, stand: Standing) => {
          if (!acc[stand.group]) acc[stand.group] = [];
          acc[stand.group].push(stand);
          return acc;
        }, {});

  await getDBStandings(competition).set({ data: standsObj, timestamp: FieldValue.serverTimestamp() });
  return standsObj;
};

const updateFixtures = async (competition: Competition, gamesToUpdate: number[], oldFixtures: Fixtures = {}) => {
  if (gamesToUpdate.length === 0) {
    const response = await getFixtures({
      league: competition.league,
      season: competition.season,
      from: competition.start,
      to: competition.end,
    });

    if (response.status !== 200) return {};

    const fixtures: Fixture[] = response.data.response;
    const fixtureMap = fixtures.reduce(
      (acc, game) => ({ ...acc, [game.fixture.id]: { ...oldFixtures[game.fixture.id], ...game } }),
      {} as Fixtures
    );

    await getDBFixtures(competition).set({ data: fixtureMap, timestamp: FieldValue.serverTimestamp() });
    return fixtureMap;
  } else {
    for (const gameID of gamesToUpdate) {
      const fullFixture = await getFullFixture(gameID);
      if (!fullFixture) return oldFixtures;

      const { fixture, teams, league, goals, score, events, lineups, statistics, players } = fullFixture;

      const extraInfo = { events, lineups, statistics, players };

      oldFixtures[gameID] = { fixture, teams, league, goals, score };

      await getDBFixturesExtraInfo(competition).collection(`${gameID}`).doc('extra').set(extraInfo, { merge: true });
    }

    await getDBFixtures(competition).set({ data: oldFixtures, timestamp: FieldValue.serverTimestamp() });

    return oldFixtures;
  }
};

const updatePoints = async (competition: Competition, predictions: Predictions, fixtures: Fixtures) => {
  const groupPoints = (await getDBGroupPoints(competition).get()).data() as GroupPoints;

  const updatedScores = Object.entries(predictions).reduce(
    (users, [gameID, gamePredictions]) => {
      const game = fixtures[parseInt(gameID)];

      if (!game) return users;

      const stage = isGroupStage(game) ? 'Groups' : game.league.round;

      for (const user in gamePredictions) {
        if (!(user in users)) {
          users[user] = { all: { ...DEFAULT_USER_RESULT } };
        }
        if (!(stage in users[user])) {
          users[user][stage] = { ...DEFAULT_USER_RESULT };
        }
        if (game?.fixture.status.short === 'NS') continue;
        users[user][stage] = joinResults(users[user][stage], getResult(gamePredictions[user], game));
        users[user]['all'] = joinResults(users[user]['all'], getResult(gamePredictions[user], game));
      }
      return users;
    },
    {} as Record<string, Record<string, UserResult>>
  );

  for (const user in updatedScores) {
    updatedScores[user]['all'].groups = 0;
    updatedScores[user]['all'].points = 0;

    for (const stage in updatedScores[user]) {
      if (stage.includes('Group')) {
        updatedScores[user][stage].groups = groupPoints[user] ?? 0;
        updatedScores[user]['all'].groups += groupPoints[user] ?? 0;
      }

      updatedScores[user][stage].points = calculateUserResultPoints(updatedScores[user][stage], competition);
    }
    updatedScores[user]['all'].points = calculateUserResultPoints(updatedScores[user]['all'], competition);
  }

  await getDBScores(competition).set(updatedScores);

  return updatedScores;
};

const updateGroups = async (
  competition: Competition,
  predictions: Predictions,
  fixtures: Fixtures,
  standings: Record<string, Standing[]>
) => {
  const users = Object.values(predictions).reduce((acc, p) => new Set([...acc, ...Object.keys(p)]), new Set<string>());

  const validUsers = [...users.values()];

  const groupPoints: Record<string, number> = validUsers.reduce((acc, user) => ({ ...acc, [user]: 0 }), {});

  for (const user of validUsers) {
    const teamsResults = calculateResults(Object.values(fixtures), predictions, user);

    const validGroups = Object.entries(standings)
      .filter(([name]) => name.includes('Group'))
      .map(([_, g]) => g);

    for (const group of validGroups) {
      const isGroupFinished = group.map(t => t.all.played).every(played => played === 3);

      if (isGroupFinished) {
        const teamsIDs = group.map(t => t.team.id);

        const sortFn = competition.league === 1 ? sortWorldCupGroup : sortGroup;
        const sortedGroup = sortFn(teamsIDs, teamsResults, fixtures, predictions, user);

        groupPoints[user] += sortedGroup.reduce((total, teamId, idx) => total + (teamId === teamsIDs[idx] ? 1 : 0), 0);
      }
    }
  }

  await getDBGroupPoints(competition).set(groupPoints);

  return groupPoints;
};

const getPredictions = async (
  decodedToken: DecodedIdToken,
  competition: Competition,
  fixtures: Fixtures,
  { adminHideScores }: Settings
) => {
  const { uid: callerUID, admin: isAdmin } = decodedToken;

  const document = await getDBPredictions(competition).get();

  const predictions = (document.data() ?? {}) as Predictions;

  logDev('adminHideScores :>> ', adminHideScores);

  if ((adminHideScores && isAdmin) || Object.keys(predictions).length === 0) return predictions;

  const censoredPredictions = Object.entries(predictions).reduce((acc, [gameId, gamePredictions]) => {
    const gameDate = new Date(fixtures?.[parseInt(gameId)].fixture.date);
    const isInFuture = gameDate && getCurrentTime() < gameDate;

    if (!isInFuture) {
      acc[gameId] = gamePredictions;
      return acc;
    }

    acc[gameId] = Object.fromEntries(
      Object.entries(gamePredictions).map(([uid, prediction]) => {
        if (uid === callerUID) return [uid, prediction];
        return [
          uid,
          {
            ...prediction,
            ...(isNum(prediction.home) ? { home: -1 } : {}),
            ...(isNum(prediction.away) ? { away: -1 } : {}),
          },
        ];
      })
    );

    return acc;
  }, {} as Predictions);

  return censoredPredictions;
};

const getUsers = async (
  competition: Competition,
  cachedPoints: Record<string, Record<string, UserResult>> | undefined
) => {
  const scores =
    cachedPoints ?? ((await getDBScores(competition).get()).data() as Record<string, Record<string, UserResult>>) ?? {};

  const authUsers = await listAllUsers();
  const allUsers = authUsers.reduce((users, { uid, displayName, photoURL, customClaims, metadata }) => {
    const isNewUser = metadata.creationTime === metadata.lastSignInTime;

    const lastSignInTimeDiff = getTimeDiff(Timestamp.fromDate(new Date(metadata.lastSignInTime)));

    const OneMonth = 60 * 60 * 24 * 31;

    const isCurrentCompetition = currentCompetitions.some(current => competition.name === current.name);

    if (!(uid in scores) && !(isCurrentCompetition && lastSignInTimeDiff < OneMonth)) {
      return users;
    }
    const score = (scores && scores[uid]) ?? {};
    const admin = customClaims?.admin as boolean;

    const shouldOnboard = isNewUser || lastSignInTimeDiff > OneMonth;

    const name = displayName?.split(' ').shift() ?? 'Unknown User';

    return { ...users, [uid]: { uid, displayName: name, photoURL, admin, score, isNewUser, shouldOnboard } };
  }, {});

  return allUsers;
};

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

app.get('/tournament', async (req, res) => {
  const authResult = await authenticate(req, res);
  if (!authResult.success) return authResult.result;

  if (!authResult.result) return res.json({});

  const decodedToken = authResult.result;

  const competition = parseCompetition(req);

  // Fetch all initial data in parallel instead of sequentially
  const [settingsDoc, fixturesDocument, standingsDocument] = await Promise.all([
    getDBSettings().get(),
    getDBFixtures(competition).get(),
    getDBStandings(competition).get(),
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

  // Parallelize the three independent fetches: predictions, user profile, and all users
  const [predictions, userExtraInfoDoc, users] = await Promise.all([
    getPredictions(decodedToken, competition, fixtures?.data, settings),
    getDBUser(decodedToken.uid).get(),
    getUsers(competition, undefined),
  ]);

  // Fire points recalculation in background — getUsers already read cached scores above
  if (fixturesTimeDiffSeconds > timeGuard || settings.allowUpdatePoints) {
    console.log('will update points (background)');
    void updatePoints(competition, predictions, fixtures?.data).catch(e =>
      console.error('Background points update failed:', e)
    );
  }

  const userExtraInfo = userExtraInfoDoc.data() ?? { leaderboards: [] };

  const leaderboards: Record<string, Leaderboard> =
    (
      await Promise.all<Leaderboard>(
        userExtraInfo?.leaderboards?.map(async (l: string) =>
          (await getFirestore(firebaseApp).collection('leaderboards').doc(l).get()).data()
        )
      )
    ).reduce((acc, l) => ({ ...acc, [l.id]: l }), {}) ?? {};

  const tournament: Tournament = {
    fixtures: fixtures?.data,
    standings: standings?.data,
    predictions,
    users,
    userExtraInfo: { noSpoilers: false, ...userExtraInfo, leaderboards },
  };

  void getDBUser(decodedToken.uid)
    .set({ lastCheckIn: FieldValue.serverTimestamp() }, { merge: true })
    .catch(e => console.error('Background lastCheckIn update failed:', e));

  res.set('Cache-Control', 'no-store');
  return res.json(tournament);
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

  if (home !== null && !isValidScore(home)) return res.status(400).json({ error: 'Invalid home score', result: false });
  if (away !== null && !isValidScore(away)) return res.status(400).json({ error: 'Invalid away score', result: false });

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

app.get('/fixture-extra', async (req, res) => {
  const authResult = await authenticate(req, res);
  if (!authResult.success) return authResult.result;

  const competition = parseCompetition(req);

  const gameID = parseInt(req.query.gameID as string, 10);
  if (!Number.isInteger(gameID) || gameID <= 0) {
    return res.status(400).json({ error: 'Invalid gameID' });
  }

  const extraDoc = await getDBFixturesExtraInfo(competition).collection(`${gameID}`).doc('extra').get();

  return res.json(extraDoc.exists ? (extraDoc.data() as FixtureExtraInfo) : {});
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

export const api = onRequest({ secrets: ['APISPORTS'], cors: corsOrigins }, app);

export { app };

// export const addUser = beforeUserCreated(async event => {
//   const user = event.data;
//   const isAdmin = ADMIN_USERS.includes(user.email ?? '');
//   console.log('addUser:', user);
//   if (user.emailVerified) {
//     await getAuth(firebaseApp).setCustomUserClaims(user.uid, { admin: isAdmin });
//   }
// });

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

app.post('/no-spoilers', async (req, res) => {
  const authResult = await authenticate(req, res);
  if (!authResult.success) return authResult.result;

  const { uid: callerUID } = authResult.result;

  const { noSpoilers } = parseBody(req.body);

  await getDBUser(callerUID).update({ noSpoilers });

  return res.json({ success: true });
});

app.post('/init-competition', async (req, res) => {
  const authResult = await authenticate(req, res, true);
  if (!authResult.success) return authResult.result;

  const competition = parseCompetition(req);

  const docs = ['predictions', 'scores', 'groupPoints'];
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
