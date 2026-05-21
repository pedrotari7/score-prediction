import request from 'supertest';
import { getTestApp, createTestUser, clearAuth, clearFirestore, seedSettings } from '../helpers';

let app: ReturnType<typeof getTestApp>;
let adminToken: string;
let userToken: string;

beforeAll(() => {
  app = getTestApp();
});

beforeEach(async () => {
  await clearFirestore();
  await clearAuth();

  adminToken = await createTestUser('admin-1', 'admin@test.com', { admin: true });
  userToken = await createTestUser('user-1', 'user@test.com');
  await seedSettings();
});

afterAll(async () => {
  await clearAuth();
  await clearFirestore();
});

describe('GET /settings', () => {
  it('returns settings for admin user', async () => {
    const res = await request(app).get('/settings').set('Authorization', adminToken);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      adminHideScores: true,
      disableLiveScoresApi: true,
    });
  });

  it('rejects non-admin user', async () => {
    const res = await request(app).get('/settings').set('Authorization', userToken);

    expect(res.status).toBe(403);
  });

  it('rejects unauthenticated request', async () => {
    const res = await request(app).get('/settings');

    expect(res.status).toBe(401);
  });
});

describe('POST /update-settings', () => {
  it('updates settings for admin user', async () => {
    const newSettings = {
      adminHideScores: false,
      allowUpdateFixtures: true,
      allowUpdateStandings: false,
      disableLiveScoresApi: false,
      allowUpdatePoints: false,
    };

    const res = await request(app)
      .post('/update-settings')
      .set('Authorization', adminToken)
      .send({ settings: newSettings });

    expect(res.status).toBe(200);

    const getRes = await request(app).get('/settings').set('Authorization', adminToken);
    expect(getRes.body.adminHideScores).toBe(false);
    expect(getRes.body.disableLiveScoresApi).toBe(false);
  });

  it('rejects non-admin user', async () => {
    const res = await request(app)
      .post('/update-settings')
      .set('Authorization', userToken)
      .send({ settings: { adminHideScores: false } });

    expect(res.status).toBe(403);
  });
});
