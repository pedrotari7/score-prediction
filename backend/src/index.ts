/* eslint-disable @typescript-eslint/indent */

import { setGlobalOptions } from 'firebase-functions/v2';
import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';

// import { beforeUserCreated } from 'firebase-functions/v2/identity';

import { initializeApp } from 'firebase-admin/app';
import { FieldValue, Timestamp, getFirestore } from 'firebase-admin/firestore';
import { getAuth, DecodedIdToken } from 'firebase-admin/auth';

import cors from 'cors';
import express, { Request, Response } from 'express';
import axios from 'axios';

import {
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
import { joinResults } from './util';
import {
  calculateResults,
  calculateUserResultPoints,
  competitions,
  currentCompetition,
  DEFAULT_USER_RESULT,
  getResult,
  isGameOnGoing,
  isGameStarted,
  isNum,
  sortGroup,
  sortWorldCupGroup,
} from '../../shared/utils';

import { rateLimit } from 'express-rate-limit';

// set up rate limiter: maximum of five requests per minute
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // max 100 requests per windowMs
});

const app = express();

// apply rate limiter to all requests
app.use(limiter);

const corsOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://score-prediction.com',
  'https://www.score-prediction.com',
  'https://score-prediction.vercel.app',
];

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

const buildUrl = (url: string, opts: Record<string, unknown>) =>
  url +
  '?' +
  Object.entries(opts)
    .map(([key, value]) => `${key}=${value}`)
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
    return error;
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

const decodeToken = async (token: string | undefined) => {
  if (!token) return;
  try {
    return await getAuth(firebaseApp).verifyIdToken(token);
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
  return (getCurrentTime().getTime() - timestamp.toMillis()) / 1000;
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

      for (const user in gamePredictions) {
        if (!(user in users)) users[user] = DEFAULT_USER_RESULT;
        if (game?.fixture.status.short === 'NS') continue;
        users[user] = joinResults(users[user], getResult(gamePredictions[user], game));
      }
      return users;
    },
    {} as Record<string, UserResult>
  );

  for (const user in groupPoints) {
    updatedScores[user].groups = groupPoints[user];
    updatedScores[user].points = calculateUserResultPoints(updatedScores[user], competition);
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

        const sortFn = competition.name === competitions.wc2022.name ? sortWorldCupGroup : sortGroup;
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

  if ((!adminHideScores && isAdmin) || Object.keys(predictions).length === 0) return predictions;

  const censoredPredictions = Object.entries(predictions).reduce((acc, [gameId, gamePredictions]) => {
    const gameDate = new Date(fixtures?.[parseInt(gameId)].fixture.date);
    const isInPast = gameDate && getCurrentTime() < gameDate;

    if (isInPast) {
      for (const uid in gamePredictions) {
        if (uid !== callerUID) {
          if (isNum(gamePredictions[uid].home)) {
            gamePredictions[uid].home = -1;
          }

          if (isNum(gamePredictions[uid].away)) {
            gamePredictions[uid].away = -1;
          }
        }
      }
    }
    acc[gameId] = gamePredictions;

    return acc;
  }, {} as Predictions);

  return censoredPredictions;
};

const getUsers = async (competition: Competition) => {
  const scores = (await getDBScores(competition).get()).data() as Record<string, UserResult>;

  const allUsers = (await getAuth(firebaseApp).listUsers()).users.reduce(
    (users, { uid, displayName, photoURL, customClaims, metadata }) => {
      const isNewUser = metadata.creationTime === metadata.lastSignInTime;

      const lastSignInTimeDiff = getTimeDiff(Timestamp.fromDate(new Date(metadata.lastSignInTime)));

      const OneMonth = 60 * 60 * 24 * 31;

      const isCurrentCompetition = competition.name === currentCompetition.name;

      if (!(uid in scores) && !(isCurrentCompetition && lastSignInTimeDiff < OneMonth)) {
        return users;
      }
      const score = (scores && scores[uid]) ?? DEFAULT_USER_RESULT;
      const admin = customClaims?.admin as boolean;

      const shouldOnboard = isNewUser || lastSignInTimeDiff > OneMonth;

      return { ...users, [uid]: { uid, displayName, photoURL, admin, score, isNewUser, shouldOnboard } };
    },
    {}
  );

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

  const predictions = (await getDBPredictions(competition).get()).data();

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

  const allUsers = (
    await Promise.all(
      (await getAuth(firebaseApp).listUsers()).users.map(async ({ displayName, metadata, uid, photoURL, email }) => ({
        displayName,
        uid,
        photoURL,
        email,
        userExtraInfo: (await getDBUser(uid).get()).data() ?? { leaderboards: [] },
        ...metadata,
      }))
    )
  ).sort((a, b) => {
    if (a.userExtraInfo.lastCheckIn && b.userExtraInfo.lastCheckIn) {
      const ta = new Timestamp(a.userExtraInfo?.lastCheckIn._seconds, a.userExtraInfo?.lastCheckIn._nanoseconds);
      const tb = new Timestamp(b.userExtraInfo?.lastCheckIn._seconds, b.userExtraInfo?.lastCheckIn._nanoseconds);
      return tb.toMillis() - ta.toMillis();
    } else if (a.userExtraInfo.lastCheckIn && a.userExtraInfo.lastCheckIn) {
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

  const settings = (await getDBSettings().get()).data() as Settings;

  const fixturesDocument = await getDBFixtures(competition).get();

  let fixtures = fixturesDocument.data();

  if (!fixtures && settings.allowUpdateFixtures && !settings.disableLiveScoresApi) {
    console.log('There are no current fixtures');
    fixtures = await updateFixtures(competition, [], {});
  }

  const fixturesTimeDiffSeconds = getTimeDiff(fixtures?.timestamp);

  const standingsDocument = await getDBStandings(competition).get();

  const standings = standingsDocument.data();

  if (!standings && settings.allowUpdateStandings && !settings.disableLiveScoresApi) {
    console.log('There are no current standings');
    const newStandings = await updateStandings(competition);
    if (newStandings) {
      standings!.data = newStandings;
    }
  }

  const standingsTimeDiffSeconds = getTimeDiff(standings?.timestamp);

  const hasGamesOngoing = Object.values<Fixture>(fixtures?.data).some(g => isGameOnGoing(g));

  const currentDate = getCurrentTime().getTime();

  const hasNonStartedGames = Object.values<Fixture>(fixtures?.data)
    .filter(g => !isGameStarted(g))
    .some(g => (currentDate - new Date(g?.fixture?.date).getTime()) / 1000 > 0);

  const timeGuard = hasGamesOngoing || hasNonStartedGames ? GAME_TIME : STALE_TIME;

  if (!settings.disableLiveScoresApi && (settings.allowUpdateStandings || standingsTimeDiffSeconds > timeGuard)) {
    console.log('standings needs update');
    const newStandings = await updateStandings(competition);
    if (newStandings) {
      standings!.data = newStandings;
    }
  }

  if (!settings.disableLiveScoresApi && (settings.allowUpdateFixtures || fixturesTimeDiffSeconds > timeGuard)) {
    console.log('fixtures needs update');

    const gamesToUpdate = hasGamesOngoing
      ? Object.values(fixtures?.data as Fixtures)
          .filter(f => isGameOnGoing(f))
          .map(f => f.fixture.id)
      : [];

    fixtures!.data = { ...fixtures?.data, ...(await updateFixtures(competition, gamesToUpdate, fixtures?.data)) };
  }

  const predictions = await getPredictions(decodedToken, competition, fixtures?.data, settings);

  if (fixturesTimeDiffSeconds > timeGuard) {
    console.log('will update points');
    await updatePoints(competition, predictions, fixtures?.data);
  }

  const users = await getUsers(competition);

  const userExtraInfo = (await getDBUser(decodedToken.uid).get()).data() ?? { leaderboards: [] };

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

  const updatedUserExtraInfo = { ...userExtraInfo, lastCheckIn: FieldValue.serverTimestamp() };

  await getDBUser(decodedToken.uid).set(updatedUserExtraInfo);

  return res.json(tournament);
});

app.post('/update-predictions', async (req, res) => {
  const authResult = await authenticate(req, res);
  if (!authResult.success) return authResult.result;

  const { uid: callerUID } = authResult.result;

  const { uid, gameId, prediction } = JSON.parse(req.body);

  if (uid !== callerUID) return res.status(403).json({ error: 'Forbidden', result: false });

  const competition = parseCompetition(req);

  const fixtures = (await getDBFixtures(competition).get()).data()?.data as Fixtures;

  const gameDate = new Date(fixtures?.[gameId].fixture.date);

  const isInPast = gameDate && getCurrentTime() < gameDate;

  if (!isInPast) return res.status(403).json({ error: 'Forbidden', result: false });

  const change = { [`${gameId}.${uid}`]: { home: prediction.home ?? null, away: prediction.away ?? null } };

  // TODO: Update this with the helper function
  const result = await getFirestore(firebaseApp).collection(competition.name).doc('predictions').update(change);

  return res.json({ ...result, success: true });
});

app.get('/points', async (req, res) => {
  const authResult = await authenticate(req, res);
  if (!authResult.success) return authResult.result;

  const competition = parseCompetition(req);

  const fixtures = (await getDBFixtures(competition).get()).data()?.data as Fixtures;

  const predictions = (await getDBPredictions(competition).get()).data() as Predictions;

  const points = await updatePoints(competition, predictions, fixtures);
  return res.json(points);
});

app.get('/groups', async (req, res) => {
  const authResult = await authenticate(req, res, true);
  if (!authResult.success) return authResult.result;

  const competition = parseCompetition(req);

  const fixtures = (await getDBFixtures(competition).get()).data()?.data as Fixtures;

  const standings = (await getDBStandings(competition).get()).data()?.data as Record<string, Standing[]>;

  const predictions = (await getDBPredictions(competition).get()).data() as Predictions;

  const groupPoints = await updateGroups(competition, predictions, fixtures, standings);

  return res.json(groupPoints);
});

app.get('/fixture-extra', async (req, res) => {
  const authResult = await authenticate(req, res);
  if (!authResult.success) return authResult.result;

  const competition = parseCompetition(req);

  const gameID = parseInt((req.query.gameID as string) ?? 0);

  const fixturesExtraInfo = (
    await getDBFixturesExtraInfo(competition).collection(`${gameID}`).doc('extra').get()
  ).data() as FixtureExtraInfo;

  return res.json(fixturesExtraInfo);
});

app.get('/cleanup', async (req, res) => {
  const authResult = await authenticate(req, res, true);
  if (!authResult.success) return authResult.result;

  const allUsers = (await getAuth(firebaseApp).listUsers()).users.map(({ uid }) => uid);

  const competition = parseCompetition(req);

  const predictions = (await getDBPredictions(competition).get()).data() as Predictions;

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

  const settings = (await getDBSettings().get()).data() as Settings;

  return res.json(settings);
});

app.post('/update-settings', async (req, res) => {
  const authResult = await authenticate(req, res, true);
  if (!authResult.success) return authResult.result;

  const { settings } = JSON.parse(req.body);

  const result = await getDBSettings().set(settings);

  return res.json(result);
});

app.post('/create-leaderboard', async (req, res) => {
  const authResult = await authenticate(req, res);
  if (!authResult.success) return res.json(authResult.result);

  const { uid: callerUID } = authResult.result;

  const { name } = JSON.parse(req.body);

  const leaderboardDoc = getFirestore(firebaseApp).collection('leaderboards').doc();

  const leaderboard: Leaderboard = { id: leaderboardDoc.id, name, members: [callerUID], creator: callerUID };

  leaderboardDoc.set(leaderboard);

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

  const leaderboardId = req.query.leaderboardId as string;

  const leaderboard = (
    await getFirestore(firebaseApp).collection('leaderboards').doc(leaderboardId).get()
  ).data() as Leaderboard;

  return res.json(leaderboard);
});

app.post('/leaderboard', async (req, res) => {
  const authResult = await authenticate(req, res);
  if (!authResult.success) return authResult.result;

  const { uid: callerUID } = authResult.result;

  const leaderboardId = req.query.leaderboardId as string;

  const leaderboard = (
    await getFirestore(firebaseApp).collection('leaderboards').doc(leaderboardId).get()
  ).data() as Leaderboard;

  if (!leaderboard.members.includes(callerUID)) {
    getFirestore(firebaseApp)
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

  const snapshot = await getFirestore(firebaseApp).collection('leaderboards').get();
  return res.json({ success: true, data: snapshot.docs.map(doc => doc.data()) });
});

export const api = onRequest({ secrets: ['APISPORTS'], cors: corsOrigins }, app);

// export const addUser = beforeUserCreated(async event => {
//   const user = event.data;
//   const isAdmin = ADMIN_USERS.includes(user.email ?? '');
//   if (user.emailVerified) {
//     await getAuth(firebaseApp).setCustomUserClaims(user.uid, { admin: isAdmin });
//   }
// });

app.delete('/leaderboard', async (req, res) => {
  const authResult = await authenticate(req, res, true);
  if (!authResult.success) return res.json(authResult.result);

  const { leaderboardId } = JSON.parse(req.body);

  const leaderboardDoc = getFirestore(firebaseApp).collection('leaderboards').doc(leaderboardId);

  const leaderboard = (await leaderboardDoc.get()).data() as Leaderboard;

  leaderboardDoc.delete();

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

  const { noSpoilers } = JSON.parse(req.body);

  const userExtraInfo = (await getDBUser(callerUID).get()).data();

  await getDBUser(callerUID).set({
    ...(userExtraInfo ?? {}),
    noSpoilers,
  });

  return res.json({ success: true });
});
