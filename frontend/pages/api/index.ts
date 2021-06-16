import { Fixtures, Prediction, Tournament, Users, VerificationResult } from '../../../interfaces/main';
import fetcher from '../../lib/fetcher';
import { backendUrl } from '../../lib/utils/envHelper';

const competition = 'euro2020';

const cFetch = async (url: string, token: string, options: any = {}) => {
	return await fetcher(url + '?' + new URLSearchParams({ competition }), token, options);
};

export const fetchTournament = async (token: string): Promise<Tournament> =>
	await cFetch(`${backendUrl}/tournament`, token);

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

export const fetchPredictions = async (token: string) => await cFetch(`${backendUrl}/fetch-predictions`, token);

export const fetchUsers = async (token: string) => await cFetch(`${backendUrl}/fetch-users`, token);

export const updatePoints = async (token: string): Promise<Users> => await cFetch(`${backendUrl}/points`, token);

export const cleanup = async (token: string): Promise<void> => await cFetch(`${backendUrl}/cleanup`, token);

export const validateToken = async (token: string): Promise<VerificationResult> =>
	await fetcher(`${backendUrl}/validate-token`, token);
