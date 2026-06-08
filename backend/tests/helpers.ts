import express from 'express';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import type { Fixture, Predictions, Settings } from '../../interfaces/main';

const AUTH_EMULATOR = process.env.FIREBASE_AUTH_EMULATOR_HOST!;
const FIRESTORE_EMULATOR = process.env.FIRESTORE_EMULATOR_HOST!;
const PROJECT_ID = 'demo-test-project';

let testApp: express.Express | null = null;

export function getTestApp(): express.Express {
  if (!testApp) {
    testApp = express();
    testApp.use(express.json());
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { app } = require('../src/index');
    testApp.use(app);
  }
  return testApp;
}

export function getDb() {
  return getFirestore();
}

export async function createTestUser(uid: string, email: string, options: { admin?: boolean } = {}): Promise<string> {
  const password = 'testpass123456';

  await getAuth().createUser({ uid, email, password });

  if (options.admin) {
    await getAuth().setCustomUserClaims(uid, { admin: true });
  }

  const res = await fetch(
    `http://${AUTH_EMULATOR}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake-key`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    }
  );

  const data = await res.json();
  if (!data.idToken) {
    throw new Error(`Failed to get ID token: ${JSON.stringify(data)}`);
  }

  return data.idToken;
}

export async function clearFirestore(): Promise<void> {
  await fetch(`http://${FIRESTORE_EMULATOR}/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents`, {
    method: 'DELETE',
  });
}

export async function clearAuth(): Promise<void> {
  await fetch(`http://${AUTH_EMULATOR}/emulator/v1/projects/${PROJECT_ID}/accounts`, {
    method: 'DELETE',
  });
}

export async function seedSettings(overrides: Partial<Settings> = {}): Promise<void> {
  const settings: Settings = {
    adminHideScores: true,
    allowUpdateFixtures: false,
    allowUpdateStandings: false,
    disableLiveScoresApi: true,
    allowUpdatePoints: false,
    enableMetricsCollection: false,
    ...overrides,
  };
  await getDb().collection('admin').doc('settings').set(settings);
}

export function makeFutureFixture(gameId: number, daysFromNow = 30): Fixture {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysFromNow);

  return {
    fixture: {
      id: gameId,
      date: futureDate.toISOString(),
      periods: { first: 0, second: 0 },
      referee: 'Test Ref',
      status: { short: 'NS', long: 'Not Started', elapsed: 0 },
      timestamp: Math.floor(futureDate.getTime() / 1000),
      timezone: 'UTC',
      venue: { city: 'Test City', id: 1, name: 'Test Stadium' },
    },
    teams: {
      home: {
        id: 10,
        name: 'Team A',
        logo: '',
        winner: null,
        colors: {} as unknown as Fixture['teams']['home']['colors'],
      },
      away: {
        id: 20,
        name: 'Team B',
        logo: '',
        winner: null,
        colors: {} as unknown as Fixture['teams']['home']['colors'],
      },
    },
    league: { country: 'World', flag: '', id: 1, logo: '', name: 'World Cup', round: 'Group A - 1', season: 2026 },
    goals: { home: 0, away: 0 },
    score: {
      extratime: { home: 0, away: 0 },
      fulltime: { home: 0, away: 0 },
      halftime: { home: 0, away: 0 },
      penalty: { home: 0, away: 0 },
    },
  };
}

export function makePastFixture(gameId: number, daysAgo = 30): Fixture {
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - daysAgo);

  return {
    ...makeFutureFixture(gameId),
    fixture: {
      ...makeFutureFixture(gameId).fixture,
      id: gameId,
      date: pastDate.toISOString(),
      status: { short: 'FT', long: 'Match Finished', elapsed: 90 },
      timestamp: Math.floor(pastDate.getTime() / 1000),
    },
    goals: { home: 2, away: 1 },
    score: {
      extratime: { home: 0, away: 0 },
      fulltime: { home: 2, away: 1 },
      halftime: { home: 1, away: 0 },
      penalty: { home: 0, away: 0 },
    },
  };
}

export async function seedFixtures(competition: string, fixtures: Record<number, Fixture>): Promise<void> {
  await getDb().collection(competition).doc('fixtures').set({
    data: fixtures,
    timestamp: Timestamp.now(),
  });
}

export async function seedPredictions(competition: string, predictions: Predictions): Promise<void> {
  await getDb().collection(competition).doc('predictions').set(predictions);
}

export async function seedUserDoc(uid: string, data: Record<string, unknown> = {}): Promise<void> {
  await getDb()
    .collection('users')
    .doc(uid)
    .set({ leaderboards: [], ...data });
}
