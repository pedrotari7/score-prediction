import { Fixtures, Prediction } from '../../components/Fixtures';
import fetcher from '../../lib/fetcher';
import { backendUrl } from '../../lib/utils/envHelper';

export const fetchFixtures = async (token: string) => await fetcher(`${backendUrl}/fixtures`, token);

export const fetchStandings = async (token: string) => await fetcher(`${backendUrl}/standings`, token);

export const resetFixtures = async (token: string) => await fetcher(`${backendUrl}/fetch-fixtures`, token);

export const resetStandings = async (token: string): Promise<Fixtures> =>
	await fetcher(`${backendUrl}/fetch-standings`, token);

export const updateFixture = async (
	token: string,
	uid: string,
	gameId: number,
	prediction: Prediction
): Promise<void> =>
	await fetcher(`${backendUrl}/update-fixtures`, token, {
		body: JSON.stringify({ uid, gameId, prediction }),
		method: 'POST',
	});

export const fetchUsers = async (token: string) => await fetcher(`${backendUrl}/users`, token);
