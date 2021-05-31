import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

import cors from 'cors';
import express, { Request, Response } from 'express';
import axios from 'axios';

const app = express();

app.use(cors({ origin: ['http://localhost:3000', 'https://score-prediction.com'] }));

const europe = functions.region('europe-west1');

admin.initializeApp();

const API_SPORTS_URL = 'https://v3.football.api-sports.io';

const ADMIN_USERS = ['pedrotari7@gmail.com'];

const buildUrl = (url: string, opts: Record<string, unknown>) =>
  url +
  '?' +
  Object.entries(opts)
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

const get = async (url: string, opts: Record<string, unknown> = {}) => {
  const options = { league: 4, season: 2020, ...opts };
  try {
    return await axios.get(buildUrl(`${API_SPORTS_URL}/${url}`, options), {
      headers: {
        'x-rapidapi-host': 'v3.football.api-sports.io',
        'x-rapidapi-key': functions.config().apisports.key,
      },
    });
  } catch (error) {
    return error;
  }
};

const getStandings = async (opts: Record<string, unknown> = {}) => await get('standings', opts);

const getFixtures = async (opts: Record<string, unknown> = {}) => await get('fixtures', opts);

const decodeToken = async (token: string) => {
  try {
    return await admin.auth().verifyIdToken(token);
  } catch (error) {
    return;
  }
};

const success = () => ({ success: true, result: undefined });

const fail = (result: any) => ({ success: false, result });

const authenticate = async (req: Request, res: Response, needsAdmin = false) => {
  if (!req.headers.authorization) {
    return fail(res.status(401).json({ error: 'No credentials sent!' }));
  }

  const decodedToken = await decodeToken(req.headers.authorization);

  if (!decodedToken) return fail(res.status(401).json({ error: 'Invalid Token' }));

  if (needsAdmin && !decodedToken.admin) return fail(res.status(403).json({ error: 'Forbidden' }));

  return success();
};

const getCurrentTime = () => {
  return new Date();
  // Mocked date
  // return new Date('2021-06-11T19:00:00+0000');
};

app.get('/fetch-standings', async (req, res) => {
  const authResult = await authenticate(req, res, true);
  if (!authResult.success) return authResult.result;

  const response = await getStandings();

  const standings = response.data.response?.[0]?.league.standings;

  const standsObj = standings.reduce((acc: Record<string, unknown>, stand: Array<any>) => {
    acc[stand[0].group.split(':')[1]?.trimStart()] = stand;
    return acc;
  }, {});

  await admin.firestore().collection('euro2020').doc('standings').set(standsObj);

  return res.json(standsObj);
});

app.get('/fetch-fixtures', async (req, res) => {
  const authResult = await authenticate(req, res, true);
  if (!authResult.success) return authResult.result;

  const previousFixtures = await admin.firestore().collection('euro2020').doc('fixtures').get();

  const fixtures = await getFixtures({ from: '2021-06-09', to: '2021-07-15' });

  const fixtureMap = fixtures.data.response.reduce((acc: any, game: any) => {
    acc[game.fixture.id] = { ...game, predictions: previousFixtures.data()?.[game.fixture.id]?.predictions ?? {} };
    return acc;
  }, {});

  await admin.firestore().collection('euro2020').doc('fixtures').set(fixtureMap);

  return res.json(fixtureMap);
});

app.get('/standings', async (req, res) => {
  const authResult = await authenticate(req, res);
  if (!authResult.success) return authResult.result;

  const document = await admin.firestore().collection('euro2020').doc('standings').get();
  return res.json({ ...document.data() });
});

app.get('/fixtures', async (req, res) => {
  const authResult = await authenticate(req, res);
  if (!authResult.success) return authResult.result;

  const document = await admin.firestore().collection('euro2020').doc('fixtures').get();
  return res.json({ ...document.data() });
});

app.post('/update-fixtures', async (req, res) => {
  const authResult = await authenticate(req, res);
  if (!authResult.success) return authResult.result;

  const { uid, gameId, prediction } = JSON.parse(req.body);

  const previousFixtures = (await admin.firestore().collection('euro2020').doc('fixtures').get()).data();

  const gameDate = new Date(previousFixtures?.[gameId].fixture.date);

  const isInPast = gameDate && getCurrentTime() < gameDate;

  if (isInPast) {
    const result = await admin
      .firestore()
      .collection('euro2020')
      .doc('fixtures')
      .update({
        [`${gameId}.predictions.${uid}`]: prediction,
      });

    return res.json(result);
  }

  return res.status(403).json({ error: 'Forbidden' });
});

app.get('/users', async (req, res) => {
  const authResult = await authenticate(req, res);
  if (!authResult.success) return authResult.result;

  const snapshot = await admin.firestore().collection('users').get();

  const usersObj = snapshot.docs.map(doc => doc.data()).reduce((users, user) => ({ ...users, [user.uid]: user }), {});

  return res.json(usersObj);
});

exports.api = europe.https.onRequest(app);

export const addUser = europe.auth.user().onCreate(async user => {
  const isAdmin = ADMIN_USERS.includes(user.email!);

  if (user.emailVerified) {
    await admin.auth().setCustomUserClaims(user.uid, { admin: isAdmin });
  }

  const { uid, displayName, photoURL } = user;

  const score = { points: 0, exact: 0, result: 0, onescore: 0, groups: 0 };

  return await admin
    .firestore()
    .collection('users')
    .doc(user.uid)
    .set({ uid, displayName, photoURL, admin: isAdmin, score });
});
