import { setGlobalOptions } from 'firebase-functions/v2';
import { onRequest } from 'firebase-functions/v2/https';

import cors from 'cors';
import express from 'express';
import { rateLimit } from 'express-rate-limit';

import { APISPORTSKEY } from './lib/api-sports';
import { registerRoutes as registerTournamentRoutes } from './routes/tournament';
import { registerRoutes as registerLeaderboardRoutes } from './routes/leaderboard';
import { registerRoutes as registerSettingsRoutes } from './routes/settings';

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

setGlobalOptions({ region: 'europe-west1' });

// Register all route modules
registerTournamentRoutes(app);
registerLeaderboardRoutes(app);
registerSettingsRoutes(app);

export const api = onRequest({ secrets: [APISPORTSKEY], cors: corsOrigins }, app);

export { app };
