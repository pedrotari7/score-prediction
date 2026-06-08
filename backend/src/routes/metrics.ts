import type { Express } from 'express';
import type { MetricsBatch } from '../../../interfaces/main';
import { authenticate, parseBody } from '../lib/auth';
import { getDBMetrics, getDBSettings, Timestamp } from '../lib/firebase';

const MAX_EVENTS_PER_BATCH = 50;
const MAX_PAYLOAD_SIZE = 1024;

const isValidBatch = (batch: MetricsBatch): boolean => {
  if (!batch?.events || !Array.isArray(batch.events) || batch.events.length === 0) return false;
  if (batch.events.length > MAX_EVENTS_PER_BATCH) return false;
  if (!batch.metadata || typeof batch.metadata !== 'object') return false;

  return batch.events.every(
    e =>
      typeof e.name === 'string' &&
      typeof e.timestamp === 'number' &&
      typeof e.sessionId === 'string' &&
      (!e.payload || JSON.stringify(e.payload).length <= MAX_PAYLOAD_SIZE)
  );
};

export const registerRoutes = (app: Express) => {
  app.get('/metrics-enabled', async (_req, res) => {
    const settingsDoc = await getDBSettings().get();
    const enabled = settingsDoc.exists ? settingsDoc.data()?.enableMetricsCollection === true : false;
    return res.json({ enabled });
  });

  app.get('/metrics-data', async (req, res) => {
    const authResult = await authenticate(req, res, true);
    if (!authResult.success) return authResult.result;

    const { eventName, uid: filterUid, sessionId, limit: limitStr } = req.query as Record<string, string>;
    const limit = Math.min(parseInt(limitStr) || 200, 1000);

    let query = getDBMetrics().orderBy('timestamp', 'desc').limit(limit) as FirebaseFirestore.Query;

    if (eventName) query = query.where('name', '==', eventName);
    if (filterUid) query = query.where('uid', '==', filterUid);
    if (sessionId) query = query.where('sessionId', '==', sessionId);

    const snapshot = await query.get();
    const events = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        uid: data.uid,
        name: data.name,
        timestamp: data.timestamp?.toMillis?.() ?? data.timestamp,
        sessionId: data.sessionId,
        payload: data.payload,
        metadata: data.metadata,
      };
    });

    return res.json({ events, total: events.length });
  });

  app.post('/metrics', async (req, res) => {
    const settingsDoc = await getDBSettings().get();
    if (!settingsDoc.exists || settingsDoc.data()?.enableMetricsCollection !== true) {
      return res.status(503).json({ error: 'Metrics collection is disabled' });
    }

    const authResult = await authenticate(req, res);
    if (!authResult.success) return authResult.result;

    const { uid } = authResult.result;
    const batch: MetricsBatch = parseBody(req.body);

    if (!isValidBatch(batch)) {
      return res.status(400).json({ error: 'Invalid metrics batch' });
    }

    const metricsCollection = getDBMetrics();
    const writeBatch = metricsCollection.firestore.batch();

    for (const event of batch.events) {
      const docRef = metricsCollection.doc();
      writeBatch.set(docRef, {
        uid,
        name: event.name,
        timestamp: Timestamp.fromMillis(event.timestamp),
        sessionId: event.sessionId,
        payload: event.payload ?? {},
        metadata: batch.metadata,
        createdAt: Timestamp.now(),
        expireAt: Timestamp.fromMillis(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });
    }

    await writeBatch.commit();

    return res.status(204).send();
  });
};
