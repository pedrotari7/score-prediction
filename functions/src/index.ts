import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

import express from 'express';
import axios from 'axios';

const app = express();

admin.initializeApp();

const API_SPORTS_URL = 'https://v3.football.api-sports.io';

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

app.get('/fetch-standings', async (_, res) => {
  const response = await getStandings();

  const standings = response.data.response?.[0]?.league.standings;

  const standsObj = standings.reduce((acc: Record<string, unknown>, stand: Array<any>) => {
    acc[stand[0].group.split(':')[1]?.trimStart()] = stand;
    return acc;
  }, {});

  await admin.firestore().collection('euro2020').doc('standings').set(standsObj);

  res.json(standsObj);
});

app.get('/fetch-fixtures', async (_, res) => {
  const fixtures = await getFixtures({ from: '2021-06-09', to: '2021-07-15' });

  await admin
    .firestore()
    .collection('euro2020')
    .doc('fixtures')
    .set({ ...fixtures.data.response });

  res.json({ ...fixtures.data.response });
});

app.get('/standings', async (req, res) => {
  if (!req.headers.authorization) {
    return res.status(401).json({ error: 'No credentials sent!' });
  }
  const decodedToken = await decodeToken(req.headers.authorization);

  if (!decodedToken) return res.status(401).json({ error: 'Invalid Token' });

  const document = await admin.firestore().collection('euro2020').doc('standings').get();
  return res.json({ ...document.data() });
});

app.get('/fixtures', async (req, res) => {
  if (!req.headers.authorization) {
    return res.status(401).json({ error: 'No credentials sent!' });
  }

  const decodedToken = await decodeToken(req.headers.authorization);

  if (!decodedToken) return res.status(401).json({ error: 'Invalid Token' });

  const document = await admin.firestore().collection('euro2020').doc('fixtures').get();
  return res.json({ ...document.data() });
});

exports.api = functions.region('europe-west1').https.onRequest(app);

export const addUser = functions.auth.user().onCreate(user => {
  return admin
    .firestore()
    .collection('users')
    .doc(user.uid)
    .set(JSON.parse(JSON.stringify(user)));
});
