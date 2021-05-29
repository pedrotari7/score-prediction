import { Fixtures } from '..';
import fetcher from '../../lib/fetcher';
import { backendUrl } from '../../lib/utils/envHelper';

export const fetchFixtures = async (token: string) => await fetcher(`${backendUrl}/fixtures`, token);

export const fetchStandings = async (token: string) => await fetcher(`${backendUrl}/standings`, token);

export const resetFixtures = async (token: string) => await fetcher(`${backendUrl}/fetch-fixtures`, token);

export const resetStandings = async (token: string): Promise<Fixtures> =>
	await fetcher(`${backendUrl}/fetch-standings`, token);

export const updateFixtures = async (token: string, fixtures: Fixtures): Promise<Fixtures> =>
	await fetcher(`${backendUrl}/update-fixtures`, token, { body: JSON.stringify(fixtures), method: 'POST' });
