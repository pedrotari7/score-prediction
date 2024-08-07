import {
	Competition,
	Fixture,
	Fixtures,
	Prediction,
	Predictions,
	PredResult,
	Result,
	UserResult,
} from '../interfaces/main';

export const competitions = {
	euro2016: {
		name: 'euro2016',
		league: 4,
		season: 2016,
		start: '2016-06-10',
		end: '2016-07-10',
		logo: '/logo.svg',
		points: { exact: 5, result: 3, onescore: 1, penalty: 1, groups: 1 },
		color: '#3292a4',
	},
	euro2020: {
		name: 'euro2020',
		league: 4,
		season: 2020,
		start: '2021-06-09',
		end: '2021-07-15',
		logo: '/logo.svg',
		points: { exact: 5, result: 3, onescore: 1, penalty: 1, groups: 1 },
		color: '#015E6C',
	},
	euro2024: {
		name: 'euro2024',
		league: 4,
		season: 2024,
		start: '2024-06-14',
		end: '2024-07-14',
		logo: '/euro2024-logo.svg',
		points: { exact: 3, result: 2, onescore: 1, penalty: 1, groups: 1 },
		color: '#002B93',
	},
	ca2024: {
		name: 'ca2024',
		league: 9,
		season: 2024,
		start: '2024-06-21',
		end: '2024-07-15',
		logo: '/ca2024-logo.png',
		points: { exact: 3, result: 2, onescore: 1, penalty: 1, groups: 1 },
		color: '#242525',
	},

	// wc2010: { name: 'wc2010', league: 1, season: 2010, start: '2010-06-10', end: '2010-07-12', logo: '/logo.svg' },
	// wc2014: { name: 'wc2014', league: 1, season: 2014, start: '2014-06-11', end: '2014-07-15', logo: '/logo.svg' },
	// wc2018: { name: 'wc2018', league: 1, season: 2018, start: '2018-06-13', end: '2018-07-16', logo: '/logo.svg' },

	wc2022: {
		name: 'wc2022',
		league: 1,
		season: 2022,
		start: '2022-11-20',
		end: '2022-12-18',
		logo: '/wc2022-logo.svg',
		points: { exact: 5, result: 3, onescore: 1, penalty: 1, groups: 1 },
		color: '#480c1d',
	},
} as const;

export const currentCompetition = competitions.euro2024;

export const currentCompetitions = [competitions.euro2024, competitions.ca2024];

export const DEFAULT_USER_RESULT: UserResult = {
	points: 0,
	exact: 0,
	result: 0,
	onescore: 0,
	penalty: 0,
	fail: 0,
	groups: 0,
};

export const isNum = (n: number | null): n is number => typeof n === 'number';

export const isEmpty = (obj: Object) => Object.keys(obj).length == 0;

export const getOutcome = (g: Result): 'winH' | 'winA' | 'draw' | null => {
	if (!isNum(g.home) || !isNum(g.away)) return null;
	if (g.home > g.away) return 'winH';
	if (g.home < g.away) return 'winA';
	return 'draw';
};

export const getExtraTimeResult = ({ score: { fulltime, extratime }, fixture, goals }: Fixture): Result => {
	if (['PEN', 'AET'].includes(fixture.status.short)) {
		return { home: fulltime.home + extratime.home, away: fulltime.away + extratime.away };
	}
	return goals;
};

export const joinResults = (a: Partial<UserResult>, b: Partial<UserResult>) => ({
	...a,
	...b,
	points: (a.points ?? 0) + (b.points ?? 0),
});

export const getResult = (prediction: Prediction, game: Fixture): Partial<UserResult> => {
	const result = getExtraTimeResult(game);

	let ret = {};

	const { home: predH, away: predA } = prediction;
	const { home: realH, away: realA } = result;

	const isExactScore = predH === realH && predA === realA;

	if (isExactScore) ret = joinResults(ret, { exact: 1 });

	const isCorrectResult =
		!isExactScore && getOutcome(prediction) !== null && getOutcome(prediction) === getOutcome(result);

	if (isCorrectResult) ret = joinResults(ret, { result: 1 });

	const isCorrectGoal = !isExactScore && !isCorrectResult && (predH === realH || predA === realA);

	if (isCorrectGoal) ret = joinResults(ret, { onescore: 1 });

	const isPenaltyWinner =
		isPenaltyShootout(game) &&
		getOutcome(prediction) !== null &&
		getOutcome(prediction) === getOutcome(game.score.penalty);

	if (isPenaltyWinner) ret = joinResults(ret, { penalty: 1 });

	if (isEmpty(ret)) return { fail: 1 };

	return ret;
};

export const isGameFinished = (game: Fixture) => ['FT', 'AET', 'PEN', 'INT', 'PST'].includes(game.fixture.status.short);

export const isPenaltyShootout = (game: Fixture) => game.fixture.status.short === 'PEN';

export const isGameStarted = (game: Fixture) => game.fixture.status.short !== 'NS';

export const isGameOnGoing = (game: Fixture) => !isGameFinished(game) && isGameStarted(game);

export const initializeTeamResult = (): PredResult => ({
	points: 0,
	wins: 0,
	draws: 0,
	loses: 0,
	ga: 0,
	gc: 0,
});

export const isGroupStage = (f: Fixture) => f.league.round.includes('Group');

export const calculatePoints = ({ wins, draws }: PredResult) => 3 * wins + draws;

export const calculateResults = (fixtures: Fixture[], predictions: Predictions, uid: string) => {
	return fixtures.filter(isGroupStage).reduce((teams, game) => {
		const homeTeam = game.teams.home.id;
		const awayTeam = game.teams.away.id;

		if (!(homeTeam in teams)) teams[homeTeam] = initializeTeamResult();
		if (!(awayTeam in teams)) teams[awayTeam] = initializeTeamResult();

		const prediction = predictions?.[game.fixture.id]?.[uid];

		if (prediction?.home >= 0 && prediction?.away >= 0) {
			if (prediction.home > prediction.away) {
				teams[homeTeam].wins += 1;
				teams[awayTeam].loses += 1;
			} else if (prediction?.home < prediction?.away) {
				teams[awayTeam].wins += 1;
				teams[homeTeam].loses += 1;
			} else {
				teams[homeTeam].draws += 1;
				teams[awayTeam].draws += 1;
			}
			teams[homeTeam].points = calculatePoints(teams[homeTeam]);
			teams[awayTeam].points = calculatePoints(teams[awayTeam]);

			teams[homeTeam].ga += prediction?.home ?? 0;
			teams[homeTeam].gc += prediction?.away ?? 0;
			teams[awayTeam].ga += prediction?.away ?? 0;
			teams[awayTeam].gc += prediction?.home ?? 0;
		}

		return teams;
	}, {} as Record<number, PredResult>);
};

export const compareResults = (rA: PredResult, rB: PredResult) => {
	if (rA.points !== rB.points) return rB.points - rA.points;

	const gdA = rA.ga - rA.gc;
	const gdB = rB.ga - rB.gc;

	if (gdA !== gdB) return gdB - gdA;

	if (rA.ga !== rB.ga) return rB.ga - rA.ga;
	return 0;
};

export const sortGroup = (
	groupTeams: number[],
	teamsResults: Record<number, PredResult>,
	fixtures: Fixtures,
	predictions: Predictions,
	userID: string
) => {
	const teamsWithSamePoints = groupTeams.reduce<Record<number, number[]>>((pack, teamID) => {
		const points = teamsResults[teamID].points;
		if (!(points in pack)) pack[points] = [];
		pack[points].push(teamID);
		return pack;
	}, {});

	const sortedStandings = Object.entries(teamsWithSamePoints)
		.sort(([a], [b]) => parseInt(b) - parseInt(a))
		.flatMap(([_, teams]) => {
			if (teams.length === 1) return teams;

			const tiedTeamsGames = Object.values(fixtures).filter(
				(f: Fixture) => teams.includes(f.teams.home.id) && teams.includes(f.teams.away.id)
			);

			const tiedTeamsResults = calculateResults(tiedTeamsGames, predictions, userID);

			const sortedTeams = Object.entries(tiedTeamsResults)
				.sort(([teamA, resultsA], [teamB, resultsB]) => {
					const localResult = compareResults(resultsA, resultsB);

					if (localResult) return localResult;

					return compareResults(teamsResults[parseInt(teamA)], teamsResults[parseInt(teamB)]);
				})
				.map(([t]) => parseInt(t));

			return sortedTeams;
		});

	return sortedStandings;
};

export const sortWorldCupGroup = (
	groupTeams: number[],
	teamsResults: Record<number, PredResult>,
	fixtures: Fixtures,
	predictions: Predictions,
	userID: string
) => {
	const idx = (p: number, gd: number, ga: number) => p * 100000 + gd * 1000 + ga;

	// The ranking of teams in the group stage is determined as follows:
	const teamsWithSamePoints = groupTeams.reduce<Record<number, number[]>>((pack, teamID) => {
		// Points obtained in all group matches
		const points = teamsResults[teamID].points;
		// Goal difference in all group matches;
		const gd = teamsResults[teamID].ga - teamsResults[teamID].gc;
		// Number of goals scored in all group matches;
		const ga = teamsResults[teamID].ga;

		const i = idx(points, gd, ga);

		if (!(i in pack)) pack[i] = [];
		pack[i].push(teamID);
		return pack;
	}, {});

	const sortedStandings = Object.entries(teamsWithSamePoints)
		.sort(([a], [b]) => parseInt(b) - parseInt(a))
		.flatMap(([_, teams]) => {
			if (teams.length === 1) return teams;

			const tiedTeamsGames = Object.values(fixtures).filter(
				(f: Fixture) => teams.includes(f.teams.home.id) && teams.includes(f.teams.away.id)
			);

			const tiedTeamsResults = calculateResults(tiedTeamsGames, predictions, userID);

			// Points obtained in the matches played between the teams in question;

			// Goal difference in the matches played between the teams in question;
			// Number of goals scored in the matches played between the teams in question;
			const sortedTeams = Object.entries(tiedTeamsResults)
				.sort(([teamA, resultsA], [teamB, resultsB]) => {
					const localResult = compareResults(resultsA, resultsB);

					if (localResult) return localResult;

					return compareResults(teamsResults[parseInt(teamA)], teamsResults[parseInt(teamB)]);
				})
				.map(([t]) => parseInt(t));

			return sortedTeams;
		});

	return sortedStandings;

	// Fair play points in all group matches (only one deduction can be applied to a player in a single match):
	// Yellow card: −1 point;
	// Indirect red card (second yellow card): −3 points;
	// Direct red card: −4 points;
	// Yellow card and direct red card: −5 points;
	// Drawing of lots.
};

export const median = (values: number[]): number => {
	values.sort();

	const half = Math.floor(values.length / 2);

	return values.length % 2 ? values[half] : Math.round((values[half - 1] + values[half]) / 2.0);
};

export const average = (values: number[]): number => values.reduce((acc, v) => acc + v) / values.length;

export const calculateUserResultPoints = (ur: Partial<UserResult>, competition: Competition) =>
	competition.points.exact * (ur.exact ?? 0) +
	competition.points.result * (ur.result ?? 0) +
	competition.points.onescore * (ur.onescore ?? 0) +
	competition.points.penalty * (ur.penalty ?? 0) +
	competition.points.groups * (ur.groups ?? 0);
