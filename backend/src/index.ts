/* eslint-disable @typescript-eslint/indent */
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

import cors from 'cors';
import express, { Request, Response } from 'express';
import axios from 'axios';

import {
  Competition,
  Competitions,
  Fixture,
  FixtureExtraInfo,
  Fixtures,
  GroupPoints,
  Predictions,
  Settings,
  Standing,
  Status,
  UserResult,
} from '../../interfaces/main';
import { DEFAULT_USER_RESULT, joinResults } from './util';
import { calculateResults, getResult, isGameOnGoing, isGameStarted, isNum, sortGroup } from '../../shared/utils';

const app = express();

app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'https://score-prediction.com',
      'https://www.score-prediction.com',
      'https://score-prediction.vercel.app',
    ],
  })
);

const europe = functions.region('europe-west1');

admin.initializeApp();

const FieldValue = admin.firestore.FieldValue;

const STALE_TIME = 60 * 60 * 4;
const GAME_TIME = 60 * 1;

const API_SPORTS_URL = 'https://v3.football.api-sports.io';

const ADMIN_USERS = ['pedrotari7@gmail.com'];

const Competitions: Competitions = {
  euro2016: { name: 'euro2016', league: 4, season: 2016 },
  euro2020: { name: 'euro2020', league: 4, season: 2020 },
};

const DEFAULT_COMPETITION = Competitions.euro2020;

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
        'x-rapidapi-key': functions.config().apisports.key,
      },
    })) as any;
  } catch (error: any) {
    return error;
  }
};

const parseCompetition = (req: Request) => Competitions[req.query.competition as string] || DEFAULT_COMPETITION;

const getStandings = async (opts: Record<string, unknown> = {}) => await get('standings', opts);

const getFixtures = async (opts: Record<string, unknown> = {}) => (await get('fixtures', opts)).data.response;

const getStatus = async (): Promise<Status> => (await get('status')).data.response;

const getFullFixture = async (eventID: number, opts: Record<string, unknown> = {}): Promise<Fixture> => {
  return (await get('fixtures', { id: eventID, ...opts })).data.response.pop();
};

const decodeToken = async (token: string | undefined) => {
  if (!token) return;
  try {
    return await admin.auth().verifyIdToken(token);
  } catch (error) {
    return;
  }
};

const success = (result: admin.auth.DecodedIdToken) => ({ success: true, result });

const fail = (result: Response<{ success: boolean; result: Record<string, Record<string, string>> }>) => ({
  success: false,
  result,
});

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
  // return new Date('2021-06-11T19:00:00+0000');
  // return new Date('2016-06-09T19:00:00+0000');
};

const getTimeDiff = (timestamp: admin.firestore.Timestamp) => {
  return (getCurrentTime().getTime() - timestamp.toMillis()) / 1000;
};

const getDbDoc = (comp: Competition, name: string) => admin.firestore().collection(comp.name).doc(name);

const getDBFixtures = (competition: Competition) => getDbDoc(competition, 'fixtures');
const getDBFixturesExtraInfo = (competition: Competition) => getDbDoc(competition, 'fixturesExtraInfo');
const getDBStandings = (competition: Competition) => getDbDoc(competition, 'standings');
const getDBPredictions = (competition: Competition) => getDbDoc(competition, 'predictions');
const getDBScores = (competition: Competition) => getDbDoc(competition, 'scores');
const getDBGroupPoints = (competition: Competition) => getDbDoc(competition, 'groupPoints');
const getDBSettings = (competition: Competition) => getDbDoc(competition, 'settings');

const updateStandings = async (competition: Competition) => {
  const response = await getStandings({ league: competition.league, season: competition.season });

  const standings =
    competition.name === 'euro2020'
      ? response.data.response?.[0]?.league.standings
      : response.data.response?.[0]?.league.standings[1];

  const standsObj =
    competition.name === 'euro2020'
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
    const fixtures: Fixture[] =
      competition.name === 'euro2020'
        ? await getFixtures({
            league: competition.league,
            season: competition.season,
            from: '2021-06-09',
            to: '2021-07-15',
          })
        : await getFixtures({ league: competition.league, season: competition.season });

    const fixtureMap = fixtures.reduce(
      (acc, game) => ({ ...acc, [game.fixture.id]: { ...oldFixtures[game.fixture.id], ...game } }),
      {} as Fixtures
    );

    await getDBFixtures(competition).set({ data: fixtureMap, timestamp: FieldValue.serverTimestamp() });
    return fixtureMap;
  } else {
    for (const gameID of gamesToUpdate) {
      const { fixture, teams, league, goals, score, events, lineups, statistics, players } = await getFullFixture(
        gameID
      );

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

  const updatedScores = Object.entries(predictions).reduce((users, [gameID, gamePredictions]) => {
    const game = fixtures[parseInt(gameID)];

    if (!game) return users;

    for (const user in gamePredictions) {
      if (!(user in users)) users[user] = DEFAULT_USER_RESULT;
      if (game?.fixture.status.short === 'NS') continue;
      users[user] = joinResults(users[user], getResult(gamePredictions[user], game));
    }
    return users;
  }, {} as Record<string, UserResult>);

  for (const user in groupPoints) {
    updatedScores[user].groups = groupPoints[user];
    updatedScores[user].points += groupPoints[user];
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
      const teamsIDs = group.map(t => t.team.id);
      const sortedGroup = sortGroup(teamsIDs, teamsResults, fixtures, predictions, user);
      groupPoints[user] += sortedGroup.reduce((total, teamId, idx) => total + (teamId === teamsIDs[idx] ? 1 : 0), 0);
    }
  }

  await getDBGroupPoints(competition).set(groupPoints);

  return groupPoints;
};

const getPredictions = async (
  decodedToken: admin.auth.DecodedIdToken,
  competition: Competition,
  fixtures: Fixtures,
  { adminHideScores }: Settings
) => {
  const { uid: callerUID, admin: isAdmin } = decodedToken;

  const document = await getDBPredictions(competition).get();

  const predictions = (document.data() ?? {}) as Predictions;

  console.log('adminHideScores :>> ', adminHideScores);

  if (!adminHideScores && isAdmin) return predictions;

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

  const allUsers = (await admin.auth().listUsers()).users.reduce(
    (users, { uid, displayName, photoURL, customClaims, metadata }) => {
      const isNewUser = metadata.creationTime === metadata.lastSignInTime;
      const score = scores[uid] ?? DEFAULT_USER_RESULT;
      const admin = customClaims?.admin;
      return { ...users, [uid]: { uid, displayName, photoURL, admin, score, isNewUser } };
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

  const allUsers = (await admin.auth().listUsers()).users
    .map(({ displayName, metadata, uid }) => ({
      displayName,
      uid,
      ...metadata,
    }))
    .sort((a, b) => new Date(b.lastSignInTime).getTime() - new Date(a.lastSignInTime).getTime());

  return res.json(allUsers);
});

app.get('/tournament', async (req, res) => {
  const authResult = await authenticate(req, res);
  if (!authResult.success) return authResult.result;

  if (!authResult.result) return res.json({});

  const decodedToken = authResult.result as admin.auth.DecodedIdToken;

  const competition = parseCompetition(req);

  const settings = (await getDBSettings(competition).get()).data() as Settings;

  const fixturesDocument = await getDBFixtures(competition).get();

  const fixtures = fixturesDocument.data()!;

  const fixturesTimeDiffSeconds = getTimeDiff(fixtures.timestamp);

  const standingsDocument = await getDBStandings(competition).get();

  const standings = standingsDocument.data()!;

  const standingsTimeDiffSeconds = getTimeDiff(standings.timestamp);

  const hasGamesOngoing = Object.values<Fixture>(fixtures.data).some(g => isGameOnGoing(g));

  const currentDate = getCurrentTime().getTime();

  const hasNonStartedGames = Object.values<Fixture>(fixtures.data)
    .filter(g => !isGameStarted(g))
    .some(g => (currentDate - new Date(g?.fixture?.date).getTime()) / 1000 > 0);

  const timeGuard = hasGamesOngoing || hasNonStartedGames ? GAME_TIME : STALE_TIME;

  if (settings.allowUpdateStandings && standingsTimeDiffSeconds > timeGuard) {
    console.log('standings needs update');
    standings.data = await updateStandings(competition);
  }

  if (settings.allowUpdateFixtures && fixturesTimeDiffSeconds > timeGuard) {
    console.log('fixtures needs update');

    const gamesToUpdate = hasGamesOngoing
      ? Object.values(fixtures.data as Fixtures)
          .filter(f => isGameOnGoing(f))
          .map(f => f.fixture.id)
      : [];

    fixtures.data = { ...fixtures.data, ...(await updateFixtures(competition, gamesToUpdate, fixtures.data)) };
  }

  const predictions = await getPredictions(decodedToken, competition, fixtures.data, settings);

  if (fixturesTimeDiffSeconds > timeGuard) {
    console.log('update points');
    await updatePoints(competition, predictions, fixtures.data);
  }

  const users = await getUsers(competition);

  return res.json({ fixtures: fixtures.data, standings: standings.data, predictions, users });
});

app.post('/update-predictions', async (req, res) => {
  const authResult = await authenticate(req, res);
  if (!authResult.success) return authResult.result;

  const { uid: callerUID } = authResult.result as admin.auth.DecodedIdToken;

  const { uid, gameId, prediction } = JSON.parse(req.body);

  if (uid !== callerUID) return res.status(403).json({ error: 'Forbidden' });

  const competition = parseCompetition(req);

  const fixtures = (await getDBFixtures(competition).get()).data()?.data as Fixtures;

  const gameDate = new Date(fixtures?.[gameId].fixture.date);

  const isInPast = gameDate && getCurrentTime() < gameDate;

  if (!isInPast) return res.status(403).json({ error: 'Forbidden' });

  let change = {};

  if (prediction.home !== null) {
    change = { [`${gameId}.${uid}.home`]: prediction.home };
  }

  if (prediction.away !== null) {
    change = { ...change, [`${gameId}.${uid}.away`]: prediction.away };
  }

  if (prediction.home === null && prediction.away === null) {
    change = { [`${gameId}.${uid}`]: { home: null, away: null } };
  }

  // TODO: Update this with the helper function
  const result = await admin.firestore().collection(competition.name).doc('predictions').update(change);

  return res.json(result);
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

  const allUsers = (await admin.auth().listUsers()).users.map(({ uid }) => uid);

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

  const { uid } = decodedToken as admin.auth.DecodedIdToken;

  return res.json({ success: true, uid });
});

app.get('/settings', async (req, res) => {
  const authResult = await authenticate(req, res, true);
  if (!authResult.success) return authResult.result;

  const competition = parseCompetition(req);

  const settings = (await getDBSettings(competition).get()).data() as Settings;

  return res.json(settings);
});

app.post('/update-settings', async (req, res) => {
  const authResult = await authenticate(req, res, true);
  if (!authResult.success) return authResult.result;

  const { settings } = JSON.parse(req.body);

  const competition = parseCompetition(req);

  const result = await getDBSettings(competition).set(settings);

  return res.json(result);
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
exports.api = europe.https.onRequest(<any>app);

export const addUser = europe.auth.user().onCreate(async user => {
  const isAdmin = ADMIN_USERS.includes(user.email ?? '');

  if (user.emailVerified) {
    await admin.auth().setCustomUserClaims(user.uid, { admin: isAdmin });
  }
});
