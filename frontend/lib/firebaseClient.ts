import { FirebaseApp, getApps, initializeApp } from 'firebase/app';
import 'firebase/auth';

const CLIENT_CONFIG = {
	apiKey: 'AIzaSyAmbXqLrVZLS0rVGabdG2XInEkqevwDJZc',
	authDomain: 'score-prediciton.firebaseapp.com',
	projectId: 'score-prediciton',
	storageBucket: 'score-prediciton.appspot.com',
	messagingSenderId: '152946763574',
	appId: '1:152946763574:web:c4e2888573db392b7c7597',
	measurementId: 'G-C49S2Z4R7Z',
};

let app: FirebaseApp;

if (!getApps().length) {
	app = initializeApp(CLIENT_CONFIG);
}

export { app };
