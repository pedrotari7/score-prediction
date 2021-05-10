import * as functions from 'firebase-functions';

import express from 'express';

const app = express();

app.get('/', (req, res) => {
  const date = new Date();
  const hours = (date.getHours() % 12) + 1; // London is UTC + 1hr;
  res.send(`
      <!doctype html>
      <head>
        <title>Time</title>
        <link rel="stylesheet" href="/style.css">
        <script src="/script.js"></script>
      </head>
      <body>
        <h1>Test trigger</h1>
        <p>In London, the clock strikes:
          <span id="bongs">${'BONG '.repeat(hours)}</span></p>
        <button onClick="refresh(this)">Refresh</button>
      </body>
    </html>`);
});

app.get('/api', (req, res) => {
  const date = new Date();
  const hours = (date.getHours() % 12) + 1; // London is UTC + 1hr;
  res.json({ bongs: 'BONG '.repeat(hours) });
});

exports.app = functions.region('europe-west1').https.onRequest(app);
