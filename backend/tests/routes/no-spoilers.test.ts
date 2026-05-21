import request from 'supertest';
import { getTestApp, createTestUser, clearAuth, clearFirestore, seedUserDoc, getDb } from '../helpers';

let app: ReturnType<typeof getTestApp>;
let userToken: string;
const USER_UID = 'spoiler-user';

beforeAll(() => {
  app = getTestApp();
});

beforeEach(async () => {
  await clearFirestore();
  await clearAuth();

  userToken = await createTestUser(USER_UID, 'spoiler@test.com');
  await seedUserDoc(USER_UID);
});

afterAll(async () => {
  await clearAuth();
  await clearFirestore();
});

describe('POST /no-spoilers', () => {
  it('enables no-spoilers mode', async () => {
    const res = await request(app).post('/no-spoilers').set('Authorization', userToken).send({ noSpoilers: true });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const doc = await getDb().collection('users').doc(USER_UID).get();
    expect(doc.data()!.noSpoilers).toBe(true);
  });

  it('disables no-spoilers mode', async () => {
    await getDb().collection('users').doc(USER_UID).set({ leaderboards: [], noSpoilers: true });

    const res = await request(app).post('/no-spoilers').set('Authorization', userToken).send({ noSpoilers: false });

    expect(res.status).toBe(200);

    const doc = await getDb().collection('users').doc(USER_UID).get();
    expect(doc.data()!.noSpoilers).toBe(false);
  });

  it('preserves existing user data', async () => {
    await getDb()
      .collection('users')
      .doc(USER_UID)
      .set({ leaderboards: ['lb-1'], noSpoilers: false });

    await request(app).post('/no-spoilers').set('Authorization', userToken).send({ noSpoilers: true });

    const doc = await getDb().collection('users').doc(USER_UID).get();
    expect(doc.data()!.leaderboards).toEqual(['lb-1']);
    expect(doc.data()!.noSpoilers).toBe(true);
  });

  it('returns 401 without auth', async () => {
    const res = await request(app).post('/no-spoilers').send({ noSpoilers: true });

    expect(res.status).toBe(401);
  });
});
