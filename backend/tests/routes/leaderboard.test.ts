import request from 'supertest';
import { getTestApp, createTestUser, clearAuth, clearFirestore, seedUserDoc, getDb } from '../helpers';

let app: ReturnType<typeof getTestApp>;
let userToken: string;
let adminToken: string;
const USER_UID = 'lb-user';
const ADMIN_UID = 'lb-admin';

beforeAll(() => {
  app = getTestApp();
});

beforeEach(async () => {
  await clearFirestore();
  await clearAuth();

  userToken = await createTestUser(USER_UID, 'lbuser@test.com');
  adminToken = await createTestUser(ADMIN_UID, 'lbadmin@test.com', { admin: true });
  await seedUserDoc(USER_UID);
  await seedUserDoc(ADMIN_UID);
});

afterAll(async () => {
  await clearAuth();
  await clearFirestore();
});

describe('POST /create-leaderboard', () => {
  it('creates a leaderboard and adds creator as member', async () => {
    const res = await request(app)
      .post('/create-leaderboard')
      .set('Authorization', userToken)
      .send({ name: 'My League' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.name).toBe('My League');
    expect(res.body.uid).toBeTruthy();

    const leaderboardId = res.body.uid;
    const doc = await getDb().collection('leaderboards').doc(leaderboardId).get();
    const lb = doc.data()!;
    expect(lb.name).toBe('My League');
    expect(lb.members).toContain(USER_UID);
    expect(lb.creator).toBe(USER_UID);

    const userDoc = await getDb().collection('users').doc(USER_UID).get();
    expect(userDoc.data()!.leaderboards).toContain(leaderboardId);
  });

  it('rejects empty name', async () => {
    const res = await request(app).post('/create-leaderboard').set('Authorization', userToken).send({ name: '' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/1-50 characters/);
  });

  it('rejects name over 50 characters', async () => {
    const res = await request(app)
      .post('/create-leaderboard')
      .set('Authorization', userToken)
      .send({ name: 'A'.repeat(51) });

    expect(res.status).toBe(400);
  });

  it('trims whitespace from name', async () => {
    const res = await request(app)
      .post('/create-leaderboard')
      .set('Authorization', userToken)
      .send({ name: '  Trimmed  ' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Trimmed');
  });
});

describe('GET /leaderboard', () => {
  it('returns leaderboard data', async () => {
    const createRes = await request(app)
      .post('/create-leaderboard')
      .set('Authorization', userToken)
      .send({ name: 'Test LB' });

    const leaderboardId = createRes.body.uid;

    const res = await request(app).get(`/leaderboard?leaderboardId=${leaderboardId}`).set('Authorization', userToken);

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Test LB');
    expect(res.body.members).toContain(USER_UID);
  });
});

describe('POST /leaderboard (join)', () => {
  it('adds user to an existing leaderboard', async () => {
    const createRes = await request(app)
      .post('/create-leaderboard')
      .set('Authorization', userToken)
      .send({ name: 'Join Me' });

    const leaderboardId = createRes.body.uid;

    const user2Token = await createTestUser('user-2', 'user2@test.com');
    await seedUserDoc('user-2');

    const res = await request(app).post(`/leaderboard?leaderboardId=${leaderboardId}`).set('Authorization', user2Token);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const doc = await getDb().collection('leaderboards').doc(leaderboardId).get();
    expect(doc.data()!.members).toContain('user-2');

    const userDoc = await getDb().collection('users').doc('user-2').get();
    expect(userDoc.data()!.leaderboards).toContain(leaderboardId);
  });

  it('is idempotent when joining twice', async () => {
    const createRes = await request(app)
      .post('/create-leaderboard')
      .set('Authorization', userToken)
      .send({ name: 'Double Join' });

    const leaderboardId = createRes.body.uid;

    await request(app).post(`/leaderboard?leaderboardId=${leaderboardId}`).set('Authorization', userToken);

    await request(app).post(`/leaderboard?leaderboardId=${leaderboardId}`).set('Authorization', userToken);

    const doc = await getDb().collection('leaderboards').doc(leaderboardId).get();
    const members = doc.data()!.members as string[];
    expect(members.filter((m: string) => m === USER_UID)).toHaveLength(1);
  });
});

describe('GET /leaderboards', () => {
  it('returns all leaderboards', async () => {
    await request(app).post('/create-leaderboard').set('Authorization', userToken).send({ name: 'LB 1' });

    await request(app).post('/create-leaderboard').set('Authorization', userToken).send({ name: 'LB 2' });

    const res = await request(app).get('/leaderboards').set('Authorization', userToken);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);
  });
});

describe('DELETE /leaderboard', () => {
  it('deletes leaderboard and removes from members', async () => {
    const createRes = await request(app)
      .post('/create-leaderboard')
      .set('Authorization', adminToken)
      .send({ name: 'To Delete' });

    const leaderboardId = createRes.body.uid;

    const res = await request(app).delete('/leaderboard').set('Authorization', adminToken).send({ leaderboardId });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const doc = await getDb().collection('leaderboards').doc(leaderboardId).get();
    expect(doc.exists).toBe(false);

    const userDoc = await getDb().collection('users').doc(ADMIN_UID).get();
    expect(userDoc.data()!.leaderboards).not.toContain(leaderboardId);
  });

  it('requires admin auth', async () => {
    const createRes = await request(app)
      .post('/create-leaderboard')
      .set('Authorization', userToken)
      .send({ name: 'Non-Admin Delete' });

    const res = await request(app)
      .delete('/leaderboard')
      .set('Authorization', userToken)
      .send({ leaderboardId: createRes.body.uid });

    expect(res.status).toBe(403);
  });
});
