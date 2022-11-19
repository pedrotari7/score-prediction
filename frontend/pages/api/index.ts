import {
	Fixtures,
	GroupPoints,
	Prediction,
	Settings,
	Tournament,
	UserResult,
	VerificationResult,
	Status,
	Competition,
	CreateLeaderboardResult,
} from '../../../interfaces/main';
import { competitions } from '../../../shared/utils';
import fetcher from '../../lib/fetcher';
import { backendUrl } from '../../lib/utils/envHelper';

const cFetch = async (
	url: string,
	token: string,
	competition: Competition = competitions.wc2022,
	query: Record<string, unknown> = {},
	options: Record<string, unknown> = {}
) => {
	return await fetcher(url + '?' + new URLSearchParams({ competition: competition.name, ...query }), token, options);
};

export const fetchTournament = async (token: string, competition: Competition): Promise<Tournament> =>
	await cFetch(`${backendUrl}/tournament`, token, competition);

export const resetFixtures = async (token: string, competition: Competition) =>
	await cFetch(`${backendUrl}/fetch-fixtures`, token, competition);

export const resetStandings = async (token: string, competition: Competition): Promise<Fixtures> =>
	await cFetch(`${backendUrl}/fetch-standings`, token, competition);

export const updatePredictions = async (
	token: string,
	uid: string,
	gameId: number,
	prediction: Prediction,
	competition: Competition
): Promise<void> => {
	return await cFetch(
		`${backendUrl}/update-predictions`,
		token,
		competition,
		{},
		{
			body: JSON.stringify({ uid, gameId, prediction }),
			method: 'POST',
		}
	);
};

export const fetchPredictions = async (token: string, competition: Competition) =>
	await cFetch(`${backendUrl}/fetch-predictions`, token, competition);

export const fetchUsers = async (token: string, competition: Competition) =>
	await cFetch(`${backendUrl}/fetch-users`, token, competition);

export const fetchFixtureExtraInfo = async (gameID: number, token: string, competition: Competition) =>
	await cFetch(`${backendUrl}/fixture-extra`, token, competition, { gameID });

export const updatePoints = async (token: string, competition: Competition): Promise<Record<string, UserResult>> =>
	await cFetch(`${backendUrl}/points`, token, competition);

export const cleanup = async (token: string, competition: Competition): Promise<void> =>
	await cFetch(`${backendUrl}/cleanup`, token, competition);

export const validateToken = async (token: string): Promise<VerificationResult> =>
	await fetcher(`${backendUrl}/validate-token`, token);

export const updateGroups = async (token: string, competition: Competition): Promise<GroupPoints> =>
	await cFetch(`${backendUrl}/groups`, token, competition);

export const fetchSettings = async (token: string): Promise<Settings> => await cFetch(`${backendUrl}/settings`, token);

export const updateSettings = async (token: string, settings: Settings): Promise<void> => {
	return await cFetch(
		`${backendUrl}/update-settings`,
		token,
		undefined,
		{},
		{
			body: JSON.stringify({ settings }),
			method: 'POST',
		}
	);
};

export const fetchStatus = async (token: string): Promise<Status> => await cFetch(`${backendUrl}/fetch-status`, token);

export const createLeaderboard = async (name: string, token: string): Promise<CreateLeaderboardResult> =>
	await cFetch(
		`${backendUrl}/create-leaderboard`,
		token,
		undefined,
		{},
		{
			body: JSON.stringify({ name }),
			method: 'POST',
		}
	);

export const fetchLeaderboard = async (leaderboardId: string, token: string) =>
	await cFetch(`${backendUrl}/leaderboard`, token, undefined, { leaderboardId });

export const joinLeaderboard = async (leaderboardId: string, token: string): Promise<CreateLeaderboardResult> =>
	await cFetch(`${backendUrl}/leaderboard`, token, undefined, { leaderboardId }, { method: 'POST' });
