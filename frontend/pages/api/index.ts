import { Fixtures, Prediction, Predictions, Users } from '../../../interfaces/main';
import fetcher from '../../lib/fetcher';
import { backendUrl } from '../../lib/utils/envHelper';

export const fetchFixtures = async (token: string): Promise<Fixtures> => await fetcher(`${backendUrl}/fixtures`, token);

export const fetchStandings = async (token: string): Promise<any> => await fetcher(`${backendUrl}/standings`, token);

export const fetchPredictions = async (token: string): Promise<Predictions> =>
	await fetcher(`${backendUrl}/predictions`, token);

export const resetFixtures = async (token: string) => await fetcher(`${backendUrl}/fetch-fixtures`, token);

export const resetStandings = async (token: string): Promise<Fixtures> =>
	await fetcher(`${backendUrl}/fetch-standings`, token);

export const updatePredictions = async (
	token: string,
	uid: string,
	gameId: number,
	prediction: Prediction
): Promise<void> =>
	await fetcher(`${backendUrl}/update-predictions`, token, {
		body: JSON.stringify({ uid, gameId, prediction }),
		method: 'POST',
	});

export const fetchUsers = async (token: string): Promise<Users> => await fetcher(`${backendUrl}/users`, token);
