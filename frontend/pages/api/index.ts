import type {
	FixtureOdds,
	Fixtures,
	GameReactions,
	GroupPoints,
	Prediction,
	Settings,
	Tournament,
	UserResult,
	VerificationResult,
	Status,
	Competition,
	CreateLeaderboardResult,
	Leaderboard,
	ResponseStatus,
	AuthenticatedUser,
	MetricsQueryEvent,
} from '../../../interfaces/main';
import { currentCompetition } from '../../../shared/utils';
import fetcher from '../../lib/fetcher';
import { backendUrl } from '../../lib/utils/envHelper';

const cFetch = async (
	url: string,
	token: string,
	competition: Competition = currentCompetition,
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
	gameId: number,
	prediction: Prediction,
	competition: Competition
): Promise<ResponseStatus> => {
	return await cFetch(
		`${backendUrl}/update-predictions`,
		token,
		competition,
		{},
		{
			body: JSON.stringify({ gameId, prediction }),
			method: 'POST',
		}
	);
};

export const fetchPredictions = async (token: string, competition: Competition) =>
	await cFetch(`${backendUrl}/fetch-predictions`, token, competition);

export const fetchUsers = async (
	token: string,
	competition: Competition
): Promise<{ success: boolean; data: AuthenticatedUser[] }> =>
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

export const fetchOdds = async (token: string, competition: Competition): Promise<FixtureOdds> =>
	await cFetch(`${backendUrl}/fetch-odds`, token, competition);

export const fetchOddsLive = async (token: string, competition: Competition): Promise<FixtureOdds> =>
	await cFetch(`${backendUrl}/fetch-odds-live`, token, competition);

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

export const fetchLeaderboard = async (
	leaderboardId: string,
	token: string,
	joinToken?: string
): Promise<Leaderboard> =>
	await cFetch(`${backendUrl}/leaderboard`, token, undefined, {
		leaderboardId,
		...(joinToken ? { joinToken } : {}),
	});

export const joinLeaderboard = async (
	leaderboardId: string,
	token: string,
	joinToken?: string
): Promise<CreateLeaderboardResult> =>
	await cFetch(
		`${backendUrl}/leaderboard`,
		token,
		undefined,
		{ leaderboardId },
		{
			body: JSON.stringify({ joinToken }),
			method: 'POST',
		}
	);

export const fetchLeaderboards = async (token: string) => await cFetch(`${backendUrl}/leaderboards`, token);

export const updateLeaderboardEmailDomain = async (
	leaderboardId: string,
	emailDomain: string | null,
	token: string
): Promise<ResponseStatus> =>
	await cFetch(
		`${backendUrl}/leaderboard-email-domain`,
		token,
		undefined,
		{},
		{
			body: JSON.stringify({ leaderboardId, emailDomain }),
			method: 'POST',
		}
	);

export const deleteLeaderboard = async (leaderboardId: string, token: string) =>
	await cFetch(
		`${backendUrl}/leaderboard`,
		token,
		undefined,
		{},
		{
			body: JSON.stringify({ leaderboardId }),
			method: 'DELETE',
		}
	);

export const initCompetition = async (token: string, competition: Competition) =>
	await cFetch(`${backendUrl}/init-competition`, token, competition, {}, { method: 'POST' });

export interface MissingSignup {
	uid: string;
	displayName: string;
	photoURL: string;
	email: string;
	lastSignInTime: string;
	creationTime: string;
}

export interface MissingSignupsResult {
	success: boolean;
	total: number;
	signedUp: number;
	missing: number;
	data: MissingSignup[];
}

export const fetchMissingSignups = async (token: string, competition: Competition): Promise<MissingSignupsResult> =>
	await cFetch(`${backendUrl}/missing-signups`, token, competition);

export const migrateLeaderboardTokens = async (token: string) =>
	await cFetch(`${backendUrl}/migrate-leaderboard-tokens`, token, undefined, {}, { method: 'POST' });

export const updateFixtureScore = async (
	token: string,
	competition: Competition,
	gameId: number,
	home: number,
	away: number,
	status: string
) =>
	await cFetch(
		`${backendUrl}/update-fixture-score`,
		token,
		competition,
		{},
		{
			body: JSON.stringify({ gameId, home, away, status }),
			method: 'POST',
		}
	);

export const updateBoost = async (
	token: string,
	gameId: number,
	competition: Competition
): Promise<{ success: boolean; boosts: number[] }> => {
	return await cFetch(
		`${backendUrl}/update-boost`,
		token,
		competition,
		{},
		{
			body: JSON.stringify({ gameId }),
			method: 'POST',
		}
	);
};

export const fetchReactions = async (
	token: string,
	gameId: number,
	competition: Competition
): Promise<GameReactions> => {
	const result = await cFetch(`${backendUrl}/reactions`, token, competition, { gameId });
	return result?.reactions ?? {};
};

export const updateReaction = async (
	token: string,
	gameId: number,
	targetUid: string,
	emoji: string,
	competition: Competition
): Promise<{ success: boolean }> =>
	await cFetch(
		`${backendUrl}/reactions`,
		token,
		competition,
		{},
		{
			body: JSON.stringify({ gameId, targetUid, emoji }),
			method: 'POST',
		}
	);

export const postNoSpoilers = async (noSpoilers: boolean, token: string): Promise<{ success: boolean }> =>
	await cFetch(
		`${backendUrl}/no-spoilers`,
		token,
		undefined,
		{},
		{
			body: JSON.stringify({ noSpoilers }),
			method: 'POST',
		}
	);

export const fetchMetricsEnabled = async (): Promise<{ enabled: boolean }> => {
	try {
		const res = await fetch(`${backendUrl}/metrics-enabled`);
		if (res.ok) return await res.json();
		return { enabled: false };
	} catch {
		return { enabled: false };
	}
};

export const fetchMetricsData = async (
	token: string,
	filters: { eventName?: string; uid?: string; sessionId?: string; limit?: number } = {}
): Promise<{ events: MetricsQueryEvent[]; total: number }> =>
	await cFetch(`${backendUrl}/metrics-data`, token, undefined, {
		...(filters.eventName ? { eventName: filters.eventName } : {}),
		...(filters.uid ? { uid: filters.uid } : {}),
		...(filters.sessionId ? { sessionId: filters.sessionId } : {}),
		...(filters.limit ? { limit: filters.limit } : {}),
	});
