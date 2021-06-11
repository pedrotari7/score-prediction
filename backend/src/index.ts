/* eslint-disable @typescript-eslint/indent */
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

import cors from 'cors';
import express, { Request, Response } from 'express';
import axios from 'axios';

import { Competition, Competitions, Fixture, Fixtures, Predictions, Standing, UserResult } from '../../interfaces/main';
import { DEFAULT_USER_RESULT, getResult, joinResults } from './util';

const app = express();

app.use(cors({ origin: ['http://localhost:3000', 'https://score-prediction.com'] }));

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
    return await axios.get(buildUrl(`${API_SPORTS_URL}/${url}`, opts), {
      headers: {
        'x-rapidapi-host': 'v3.football.api-sports.io',
        'x-rapidapi-key': functions.config().apisports.key,
      },
    });
  } catch (error) {
    return error;
  }
};

const parseCompetition = (req: Request) => Competitions[req.query.competition as string] || DEFAULT_COMPETITION;

const getStandings = async (opts: Record<string, unknown> = {}) => await get('standings', opts);

const getFixtures = async (opts: Record<string, unknown> = {}) => (await get('fixtures', opts)).data.response;

const decodeToken = async (token: string) => {
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
const getDBStandings = (competition: Competition) => getDbDoc(competition, 'standings');
const getDBPredictions = (competition: Competition) => getDbDoc(competition, 'predictions');
const getDBScores = (competition: Competition) => getDbDoc(competition, 'scores');

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

const updateFixtures = async (competition: Competition) => {
  const fixtures: Fixture[] =
    competition.name === 'euro2020'
      ? await getFixtures({
          league: competition.league,
          season: competition.season,
          from: '2021-06-09',
          to: '2021-07-15',
        })
      : await getFixtures({ league: competition.league, season: competition.season });

  const fixtureMap = fixtures.reduce((acc, game) => ({ ...acc, [game.fixture.id]: game }), {} as Fixtures);

  await getDBFixtures(competition).set({ data: fixtureMap, timestamp: FieldValue.serverTimestamp() });
  return fixtureMap;
};

const updatePoints = async (competition: Competition, predictions: Predictions, fixtures: Fixtures) => {
  const updatedScores = Object.entries(predictions).reduce((users, [gameID, gamePredictions]) => {
    const game = fixtures[gameID]?.goals;

    if (!game) return users;

    for (const user in gamePredictions) {
      if (!(user in users)) users[user] = DEFAULT_USER_RESULT;
      if (fixtures[gameID]?.fixture.status.short === 'NS') continue;
      users[user] = joinResults(users[user], getResult(gamePredictions[user], game));
    }
    return users;
  }, {} as Record<string, UserResult>);

  await getDBScores(competition).set(updatedScores);
};

const getPredictions = async (
  decodedToken: admin.auth.DecodedIdToken,
  competition: Competition,
  fixtures: Fixtures
) => {
  const { uid: callerUID } = decodedToken;

  const document = await getDBPredictions(competition).get();

  const predictions = (document.data() ?? {}) as Predictions;

  // if (isAdmin) return predictions;

  const censoredPredictions = Object.entries(predictions).reduce((acc, [gameId, gamePredictions]) => {
    const gameDate = new Date(fixtures?.[gameId].fixture.date);
    const isInPast = gameDate && getCurrentTime() < gameDate;

    if (isInPast) {
      for (const uid in gamePredictions) {
        if (uid !== callerUID) {
          gamePredictions[uid].home = -1;
          gamePredictions[uid].away = -1;
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

  const data = await updateFixtures(competition);

  return res.json(data);
});

app.get('/tournament', async (req, res) => {
  const authResult = await authenticate(req, res);
  if (!authResult.success) return authResult.result;

  if (!authResult.result) return res.json({});

  const decodedToken = authResult.result as admin.auth.DecodedIdToken;

  const competition = parseCompetition(req);

  const fixturesDocument = await getDBFixtures(competition).get();

  const fixtures = fixturesDocument.data()!;

  const fixturesTimeDiffSeconds = getTimeDiff(fixtures.timestamp);

  const standingsDocument = await getDBStandings(competition).get();

  const standings = standingsDocument.data()!;

  const standingsTimeDiffSeconds = getTimeDiff(standings.timestamp);

  const currentDate = getCurrentTime().getTime();

  const gameDates = Object.values(fixtures.data as Fixtures).map(
    f => (currentDate - new Date(f?.fixture?.date).getTime()) / 1000
  );

  const OneAndHalfHour = 2 * 60 * 60;

  const hasGameInRange = gameDates.some(d => d >= 0 && d < OneAndHalfHour);

  const timeGuard = hasGameInRange ? GAME_TIME : STALE_TIME;

  if (standingsTimeDiffSeconds > timeGuard) {
    console.log('standings needs update');
    standings.data = await updateStandings(competition);
  }

  if (fixturesTimeDiffSeconds > timeGuard) {
    console.log('fixtures needs update');
    fixtures.data = await updateFixtures(competition);
  }

  const predictions = await getPredictions(decodedToken, competition, fixtures.data);

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

  const result = await admin
    .firestore()
    .collection(competition.name)
    .doc('predictions')
    .update({
      [`${gameId}.${uid}`]: prediction,
    });

  return res.json(result);
});

app.get('/points', async (req, res) => {
  const authResult = await authenticate(req, res);
  if (!authResult.success) return authResult.result;

  const competition = parseCompetition(req);

  const fixtures = (await getDBFixtures(competition).get()).data()?.data as Fixtures;

  const predictions = (await getDBPredictions(competition).get()).data() as Predictions;

  await updatePoints(competition, predictions, fixtures);

  return res.json({});
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

exports.api = europe.https.onRequest(app);

export const addUser = europe.auth.user().onCreate(async user => {
  const isAdmin = ADMIN_USERS.includes(user.email ?? '');

  if (user.emailVerified) {
    await admin.auth().setCustomUserClaims(user.uid, { admin: isAdmin });
  }
});
