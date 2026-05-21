import request from 'supertest';
import {
  getTestApp,
  createTestUser,
  clearAuth,
  clearFirestore,
  seedSettings,
  seedFixtures,
  seedPredictions,
  seedUserDoc,
  makeFutureFixture,
  makePastFixture,
  getDb,
} from '../helpers';

const COMPETITION = 'wc2026';
let app: ReturnType<typeof getTestApp>;
let userToken: string;
const USER_UID = 'pred-user';

beforeAll(() => {
  app = getTestApp();
});

beforeEach(async () => {
  await clearFirestore();
  await clearAuth();

  userToken = await createTestUser(USER_UID, 'pred@test.com');
  await seedSettings();
  await seedUserDoc(USER_UID);
});

afterAll(async () => {
  await clearAuth();
  await clearFirestore();
});

describe('POST /update-predictions', () => {
  it('saves a valid prediction for a future game', async () => {
    const fixture = makeFutureFixture(1001);
    await seedFixtures(COMPETITION, { 1001: fixture });
    await seedPredictions(COMPETITION, {});

    const res = await request(app)
      .post(`/update-predictions?competition=${COMPETITION}`)
      .set('Authorization', userToken)
      .send({ uid: USER_UID, gameId: 1001, prediction: { home: 2, away: 1 } });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const doc = await getDb().collection(COMPETITION).doc('predictions').get();
    const data = doc.data()!;
    expect(data['1001'][USER_UID]).toEqual({ home: 2, away: 1 });
  });

  it('rejects prediction for a past game', async () => {
    const fixture = makePastFixture(2001);
    await seedFixtures(COMPETITION, { 2001: fixture });
    await seedPredictions(COMPETITION, {});

    const res = await request(app)
      .post(`/update-predictions?competition=${COMPETITION}`)
      .set('Authorization', userToken)
      .send({ uid: USER_UID, gameId: 2001, prediction: { home: 1, away: 0 } });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Forbidden');
  });

  it('rejects prediction from a different user', async () => {
    const fixture = makeFutureFixture(1002);
    await seedFixtures(COMPETITION, { 1002: fixture });
    await seedPredictions(COMPETITION, {});

    const res = await request(app)
      .post(`/update-predictions?competition=${COMPETITION}`)
      .set('Authorization', userToken)
      .send({ uid: 'someone-else', gameId: 1002, prediction: { home: 1, away: 0 } });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Forbidden');
  });

  it('rejects invalid score values', async () => {
    const fixture = makeFutureFixture(1003);
    await seedFixtures(COMPETITION, { 1003: fixture });
    await seedPredictions(COMPETITION, {});

    const res = await request(app)
      .post(`/update-predictions?competition=${COMPETITION}`)
      .set('Authorization', userToken)
      .send({ uid: USER_UID, gameId: 1003, prediction: { home: -1, away: 0 } });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid home score');
  });

  it('rejects score over 99', async () => {
    const fixture = makeFutureFixture(1004);
    await seedFixtures(COMPETITION, { 1004: fixture });
    await seedPredictions(COMPETITION, {});

    const res = await request(app)
      .post(`/update-predictions?competition=${COMPETITION}`)
      .set('Authorization', userToken)
      .send({ uid: USER_UID, gameId: 1004, prediction: { home: 0, away: 100 } });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid away score');
  });

  it('rejects non-integer scores', async () => {
    const fixture = makeFutureFixture(1005);
    await seedFixtures(COMPETITION, { 1005: fixture });
    await seedPredictions(COMPETITION, {});

    const res = await request(app)
      .post(`/update-predictions?competition=${COMPETITION}`)
      .set('Authorization', userToken)
      .send({ uid: USER_UID, gameId: 1005, prediction: { home: 1.5, away: 0 } });

    expect(res.status).toBe(400);
  });

  it('allows null scores (clearing a prediction)', async () => {
    const fixture = makeFutureFixture(1006);
    await seedFixtures(COMPETITION, { 1006: fixture });
    // eslint-disable-next-line quote-props
    await seedPredictions(COMPETITION, { '1006': { [USER_UID]: { home: 1, away: 0 } } });

    const res = await request(app)
      .post(`/update-predictions?competition=${COMPETITION}`)
      .set('Authorization', userToken)
      .send({ uid: USER_UID, gameId: 1006, prediction: { home: null, away: null } });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 401 without auth token', async () => {
    const res = await request(app)
      .post(`/update-predictions?competition=${COMPETITION}`)
      .send({ uid: USER_UID, gameId: 1001, prediction: { home: 1, away: 0 } });

    expect(res.status).toBe(401);
  });
});
