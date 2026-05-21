process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
process.env.GCLOUD_PROJECT = 'demo-test-project';
process.env.FIREBASE_CONFIG = JSON.stringify({ projectId: 'demo-test-project' });
process.env.APISPORTS = 'fake-api-key';
process.env.ISDEV = '1';
