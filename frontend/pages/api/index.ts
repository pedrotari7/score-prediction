import { Fixtures, Prediction, Predictions, Users } from '../../../interfaces/main';
import fetcher from '../../lib/fetcher';
import { backendUrl } from '../../lib/utils/envHelper';

const competition = 'euro2020';

const cFetch = async (url: string, token: string, options: any = {}) => {
	return await fetcher(url + '?' + new URLSearchParams({ competition }), token, options);
};

export const fetchFixtures = async (token: string): Promise<Fixtures> => await cFetch(`${backendUrl}/fixtures`, token);

export const fetchStandings = async (token: string): Promise<any> => await cFetch(`${backendUrl}/standings`, token);

export const fetchPredictions = async (token: string): Promise<Predictions> =>
	await cFetch(`${backendUrl}/predictions`, token);

export const resetFixtures = async (token: string) => await cFetch(`${backendUrl}/fetch-fixtures`, token);

export const resetStandings = async (token: string): Promise<Fixtures> =>
	await cFetch(`${backendUrl}/fetch-standings`, token);

export const updatePredictions = async (
	token: string,
	uid: string,
	gameId: number,
	prediction: Prediction
): Promise<void> => {
	return await cFetch(`${backendUrl}/update-predictions`, token, {
		body: JSON.stringify({ uid, gameId, prediction }),
		method: 'POST',
	});
};

export const updatePoints = async (token: string): Promise<Users> => await cFetch(`${backendUrl}/points`, token);

export const fetchUsers = async (token: string): Promise<Users> => await cFetch(`${backendUrl}/users`, token);
