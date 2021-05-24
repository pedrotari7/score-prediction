export const backendUrl =
	process.env.NEXT_PUBLIC_APP_ENV === 'local-dev'
		? 'http://localhost:5001/score-prediciton/europe-west1/api/'
		: 'https://europe-west1-score-prediciton.cloudfunctions.net/api';
