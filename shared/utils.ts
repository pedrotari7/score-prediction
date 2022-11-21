import {
	Competitions,
	Fixture,
	Fixtures,
	Prediction,
	Predictions,
	PredResult,
	Result,
	UserResult,
} from '../interfaces/main';

export const competitions: Competitions = {
	euro2016: { name: 'euro2016', league: 4, season: 2016, start: '2016-06-10', end: '2016-07-10', logo: '/logo.svg' },
	euro2020: { name: 'euro2020', league: 4, season: 2020, start: '2021-06-09', end: '2021-07-15', logo: '/logo.svg' },

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
	},
};

export const isNum = (n: number | null): n is number => typeof n === 'number';

export const isEmpty = (obj: Object) => Object.keys(obj).length == 0;

export const getOutcome = (g: Result): 'winH' | 'winA' | 'draw' | null => {
	if (!isNum(g.home) || !isNum(g.away)) return null;
	if (g.home > g.away) return 'winH';
	if (g.home < g.away) return 'winA';
	if (g.home === g.away) return 'draw';
	return null;
};

export const getExtraTimeResult = ({ score: { fulltime, extratime }, fixture, goals }: Fixture) => {
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

	if (isExactScore) ret = joinResults(ret, { points: 5, exact: 1 });

	const isCorrectResult =
		!isExactScore && getOutcome(prediction) !== null && getOutcome(prediction) === getOutcome(result);

	if (isCorrectResult) ret = joinResults(ret, { points: 3, result: 1 });

	const isCorrectGoal = !isExactScore && !isCorrectResult && (predH === realH || predA === realA);

	if (isCorrectGoal) ret = joinResults(ret, { points: 1, onescore: 1 });

	const isPenaltyWinner =
		isPenaltyShootout(game) &&
		getOutcome(prediction) !== null &&
		getOutcome(prediction) === getOutcome(game.score.penalty);

	if (isPenaltyWinner) ret = joinResults(ret, { points: 1, penalty: 1 });

	if (isEmpty(ret)) return { points: 0, fail: 1 };

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

export const calculatePoints = ({ wins, draws }: PredResult) => 3 * wins + draws;

export const calculateResults = (fixtures: Fixture[], predictions: Predictions, uid: string) => {
	const isGroupStage = (f: Fixture) => f.league.round.includes('Group');

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
