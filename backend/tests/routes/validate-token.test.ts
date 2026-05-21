import request from 'supertest';
import { getTestApp, createTestUser, clearAuth, clearFirestore } from '../helpers';

let app: ReturnType<typeof getTestApp>;

beforeAll(() => {
  app = getTestApp();
});

afterEach(async () => {
  await clearAuth();
  await clearFirestore();
});

describe('GET /validate-token', () => {
  it('returns success with uid for a valid token', async () => {
    const token = await createTestUser('user-1', 'user1@test.com');

    const res = await request(app).get('/validate-token').set('Authorization', token);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.uid).toBe('user-1');
  });

  it('returns failure for missing token', async () => {
    const res = await request(app).get('/validate-token');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(false);
    expect(res.body.uid).toBe('');
  });

  it('returns failure for invalid token', async () => {
    const res = await request(app).get('/validate-token').set('Authorization', 'garbage-token');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(false);
    expect(res.body.uid).toBe('');
  });
});
