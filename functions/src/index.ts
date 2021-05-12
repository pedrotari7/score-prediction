import * as functions from 'firebase-functions';
import express from 'express';
import axios from 'axios';

const app = express();

// const API_SPORTS_URL = 'https://v3.football.api-sports.io';

const getStandings = async () => {
  try {
    const response = await axios.get('https://v3.football.api-sports.io/standings?league=4&season=2020', {
      headers: {
        'x-rapidapi-host': 'v3.football.api-sports.io',
        'x-rapidapi-key': functions.config().apisports.key,
      },
    });
    console.log(response);
    return response;
  } catch (error) {
    console.error(error);
    return error;
  }
};

app.get('/standings', async (req, res) => {
  const standings = await getStandings();
  res.json({ ...standings.data.response?.[0]?.league });
});

exports.api = functions.region('europe-west1').https.onRequest(app);
