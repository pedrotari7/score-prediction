import { useMemo } from 'react';
import type { Competition, Fixture, FixtureOdds, Predictions, UserResult, Users } from '../../interfaces/main';
import {
	calculateUserResultPoints,
	getExtraTimeResult,
	getOutcome,
	getResult,
	isGameFinished,
	isPredictionUpset,
	isUpsetResult,
} from '../../shared/utils';

interface GameHighlight {
	fixture: Fixture;
	prediction: { home: number; away: number };
	points: number;
	resultType: 'exact' | 'result' | 'onescore' | 'penalty' | 'fail';
	wasUpset: boolean;
	wasBoosted: boolean;
}

interface StreakInfo {
	length: number;
	startGame: Fixture;
	endGame: Fixture;
}

interface RecapData {
	totalPredictions: number;
	totalGamesFinished: number;
	totalPoints: number;
	rank: number;
	totalPlayers: number;
	bestMoment: GameHighlight | null;
	worstMoment: GameHighlight | null;
	longestStreak: StreakInfo | null;
	nemesis: { category: string; count: number; description: string } | null;
	boldestCall: GameHighlight | null;
	boostReport: { games: GameHighlight[]; totalBonusPoints: number };
	accuracy: { exact: number; result: number; onescore: number; fail: number; total: number };
	favoriteScoreline: { scoreline: string; count: number } | null;
	topPercentile: number;
	stageRanks: { stage: string; rank: number; points: number }[];
	allHighlights: GameHighlight[];
}

const getResultType = (ur: Partial<UserResult>): GameHighlight['resultType'] => {
	if (ur.exact) return 'exact';
	if (ur.result) return 'result';
	if (ur.onescore) return 'onescore';
	if (ur.penalty) return 'penalty';
	return 'fail';
};

export const useRecapData = (
	uid: string,
	fixtures: Record<number, Fixture>,
	predictions: Predictions,
	users: Users,
	odds: FixtureOdds,
	boosts: Record<string, number[]>,
	competition: Competition
): RecapData | null => {
	return useMemo(() => {
		if (!uid || !fixtures || !Object.keys(fixtures).length) return null;

		const userBoosts = boosts[uid] ?? [];
		const finishedGames = Object.values(fixtures)
			.filter(isGameFinished)
			.sort((a, b) => a.fixture.timestamp - b.fixture.timestamp);

		const highlights: GameHighlight[] = [];

		for (const game of finishedGames) {
			const pred = predictions[game.fixture.id]?.[uid];
			if (!pred || pred.home === undefined || pred.away === undefined) continue;

			const isUpset = isUpsetResult(game, odds);
			const gameResult = getResult(pred, game, isUpset);
			const resultType = getResultType(gameResult);
			const wasBoosted = userBoosts.includes(game.fixture.id);

			let points = calculateUserResultPoints(gameResult, competition);
			if (wasBoosted) points *= 2;

			highlights.push({
				fixture: game,
				prediction: { home: pred.home, away: pred.away },
				points,
				resultType,
				wasUpset: isUpset && (resultType === 'exact' || resultType === 'result'),
				wasBoosted,
			});
		}

		if (highlights.length === 0) return null;

		const totalPredictions = highlights.length;
		const user = users[uid];
		const totalPoints = user?.score?.['all']?.points ?? 0;

		const sortedUsers = Object.values(users).sort(
			(a, b) => (b.score?.['all']?.points ?? 0) - (a.score?.['all']?.points ?? 0)
		);
		const rank = sortedUsers.findIndex(u => u.uid === uid) + 1;
		const totalPlayers = sortedUsers.length;
		const topPercentile = totalPlayers > 1 ? Math.round(((rank - 1) / (totalPlayers - 1)) * 100) : 0;

		const bestMoment =
			[...highlights].sort((a, b) => {
				if (b.points !== a.points) return b.points - a.points;
				if (a.resultType === 'exact' && b.resultType !== 'exact') return -1;
				if (b.resultType === 'exact' && a.resultType !== 'exact') return 1;
				return 0;
			})[0] ?? null;

		const worstHighPoints = highlights
			.filter(h => h.resultType === 'fail')
			.sort((a, b) => {
				const resultA = getExtraTimeResult(a.fixture);
				const resultB = getExtraTimeResult(b.fixture);
				const diffA = Math.abs(a.prediction.home - resultA.home) + Math.abs(a.prediction.away - resultA.away);
				const diffB = Math.abs(b.prediction.home - resultB.home) + Math.abs(b.prediction.away - resultB.away);
				return diffB - diffA;
			});
		const worstMoment = worstHighPoints[0] ?? null;

		let longestStreak: StreakInfo | null = null;
		let currentStreakStart = 0;
		let currentStreakLen = 0;
		for (let i = 0; i < highlights.length; i++) {
			if (highlights[i].resultType !== 'fail') {
				if (currentStreakLen === 0) currentStreakStart = i;
				currentStreakLen++;
			} else {
				if (currentStreakLen > (longestStreak?.length ?? 0)) {
					longestStreak = {
						length: currentStreakLen,
						startGame: highlights[currentStreakStart].fixture,
						endGame: highlights[i - 1].fixture,
					};
				}
				currentStreakLen = 0;
			}
		}
		if (currentStreakLen > (longestStreak?.length ?? 0)) {
			longestStreak = {
				length: currentStreakLen,
				startGame: highlights[currentStreakStart].fixture,
				endGame: highlights[highlights.length - 1].fixture,
			};
		}

		const accuracy = {
			exact: highlights.filter(h => h.resultType === 'exact').length,
			result: highlights.filter(h => h.resultType === 'result').length,
			onescore: highlights.filter(h => h.resultType === 'onescore').length,
			fail: highlights.filter(h => h.resultType === 'fail').length,
			total: highlights.length,
		};

		const outcomeMap: Record<string, number> = { draw: 0, home: 0, away: 0 };
		const failsByOutcome: Record<string, number> = { draw: 0, home: 0, away: 0 };
		for (const h of highlights) {
			const actualResult = getExtraTimeResult(h.fixture);
			const outcome = getOutcome(actualResult);
			if (outcome === 'draw') outcomeMap.draw++;
			else if (outcome === 'winH') outcomeMap.home++;
			else if (outcome === 'winA') outcomeMap.away++;

			if (h.resultType === 'fail') {
				if (outcome === 'draw') failsByOutcome.draw++;
				else if (outcome === 'winH') failsByOutcome.home++;
				else if (outcome === 'winA') failsByOutcome.away++;
			}
		}

		let nemesis: RecapData['nemesis'] = null;
		const failRate = (outcome: string) =>
			outcomeMap[outcome] > 0 ? failsByOutcome[outcome] / outcomeMap[outcome] : 0;

		const drawFailRate = failRate('draw');
		const homeFailRate = failRate('home');
		const awayFailRate = failRate('away');

		if (failsByOutcome.draw + failsByOutcome.home + failsByOutcome.away > 0) {
			if (drawFailRate >= homeFailRate && drawFailRate >= awayFailRate && failsByOutcome.draw >= 2) {
				nemesis = {
					category: 'Draws',
					count: failsByOutcome.draw,
					description: `You missed ${failsByOutcome.draw} of ${outcomeMap.draw} draws`,
				};
			} else if (homeFailRate >= awayFailRate && failsByOutcome.home >= 2) {
				nemesis = {
					category: 'Home wins',
					count: failsByOutcome.home,
					description: `You missed ${failsByOutcome.home} of ${outcomeMap.home} home wins`,
				};
			} else if (failsByOutcome.away >= 2) {
				nemesis = {
					category: 'Away wins',
					count: failsByOutcome.away,
					description: `You missed ${failsByOutcome.away} of ${outcomeMap.away} away wins`,
				};
			}
		}

		const upsetHighlights = highlights.filter(h => h.wasUpset);
		const boldUpsets = highlights.filter(h => {
			const gameOdds = odds[h.fixture.fixture.id];
			return gameOdds && isPredictionUpset(h.prediction, gameOdds);
		});
		const boldestCall =
			upsetHighlights.sort((a, b) => b.points - a.points)[0] ??
			boldUpsets.sort((a, b) => b.points - a.points)[0] ??
			null;

		const boostHighlights = highlights.filter(h => h.wasBoosted);
		const boostReport = {
			games: boostHighlights,
			totalBonusPoints: boostHighlights.reduce((sum, h) => sum + Math.floor(h.points / 2), 0),
		};

		const scorelineCounts: Record<string, number> = {};
		for (const h of highlights) {
			const key = `${h.prediction.home}-${h.prediction.away}`;
			scorelineCounts[key] = (scorelineCounts[key] ?? 0) + 1;
		}
		const favEntry = Object.entries(scorelineCounts).sort((a, b) => b[1] - a[1])[0];
		const favoriteScoreline = favEntry ? { scoreline: favEntry[0], count: favEntry[1] } : null;

		const stageKeys = Object.keys(user?.score ?? {}).filter(k => k !== 'all');
		const stageRanks = stageKeys.map(stage => {
			const stageUsers = Object.values(users)
				.filter(u => u.score?.[stage]?.points !== undefined)
				.sort((a, b) => (b.score[stage]?.points ?? 0) - (a.score[stage]?.points ?? 0));
			const stageRank = stageUsers.findIndex(u => u.uid === uid) + 1;
			return { stage, rank: stageRank, points: user?.score?.[stage]?.points ?? 0 };
		});

		return {
			totalPredictions,
			totalGamesFinished: finishedGames.length,
			totalPoints,
			rank,
			totalPlayers,
			bestMoment,
			worstMoment,
			longestStreak,
			nemesis,
			boldestCall,
			boostReport,
			accuracy,
			favoriteScoreline,
			topPercentile,
			stageRanks,
			allHighlights: highlights,
		};
	}, [uid, fixtures, predictions, users, odds, boosts, competition]);
};
