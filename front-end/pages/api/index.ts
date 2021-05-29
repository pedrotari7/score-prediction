import fetcher from '../../lib/fetcher';
import { backendUrl } from '../../lib/utils/envHelper';

export const fetchFixtures = async (token: string) => await fetcher(`${backendUrl}/fixtures`, token);

export const fetchStandings = async (token: string) => await fetcher(`${backendUrl}/standings`, token);

export const resetFixtures = async (token: string) => await fetcher(`${backendUrl}/fetch-fixtures`, token);

export const resetStandings = async (token: string) => await fetcher(`${backendUrl}/fetch-standings`, token);
