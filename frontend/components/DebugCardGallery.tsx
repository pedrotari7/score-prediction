import { useEffect, useState } from 'react';
import type { Fixture, Fixtures, Prediction, Predictions } from '../../interfaces/main';
import { competitions } from '../../shared/utils';
import useCompetition from '../hooks/useCompetition';
import { classNames } from '../lib/utils/reactHelper';
import Game from './Game';
import { useTournamentStore } from '../store/tournamentStore';

const makeTeam = (id: number, name: string) => ({
	id,
	name,
	logo: '',
	winner: null,
	colors: {
		player: { primary: '', number: '', border: '' },
		goalkeeper: { primary: '', number: '', border: '' },
	},
});

const makeFixture = (overrides: {
	id: number;
	status?: string;
	homeGoals?: number | null;
	awayGoals?: number | null;
	penaltyHome?: number | null;
	penaltyAway?: number | null;
	homeName?: string;
	awayName?: string;
	homeId?: number;
	awayId?: number;
	round?: string;
	venue?: string;
	city?: string;
}): Fixture => ({
	fixture: {
		id: overrides.id,
		date: new Date(Date.now() - 7200000).toISOString(),
		periods: { first: 0, second: 0 },
		referee: '',
		status: { elapsed: 90, long: '', short: overrides.status ?? 'FT' },
		timestamp: Date.now() / 1000 - 7200,
		timezone: 'UTC',
		venue: { city: overrides.city ?? 'New York', id: 0, name: overrides.venue ?? 'MetLife Stadium' },
	},
	teams: {
		home: makeTeam(overrides.homeId ?? 1, overrides.homeName ?? 'Brazil'),
		away: makeTeam(overrides.awayId ?? 25, overrides.awayName ?? 'Germany'),
	},
	league: { country: '', flag: '', id: 1, logo: '', name: '', round: overrides.round ?? 'Group A - 1', season: 2026 },
	goals: { home: overrides.homeGoals ?? 0, away: overrides.awayGoals ?? 0 },
	score: {
		fulltime: { home: overrides.homeGoals ?? 0, away: overrides.awayGoals ?? 0 },
		halftime: { home: 0, away: 0 },
		extratime: { home: 0, away: 0 },
		penalty: { home: overrides.penaltyHome ?? null!, away: overrides.penaltyAway ?? null! },
	},
});

const makeFixturePEN = (
	id: number,
	homeGoals: number,
	awayGoals: number,
	penH: number,
	penA: number,
	extra?: Partial<Parameters<typeof makeFixture>[0]>
): Fixture => {
	const base = makeFixture({
		id,
		...extra,
		status: 'PEN',
		homeGoals,
		awayGoals,
		penaltyHome: penH,
		penaltyAway: penA,
	});
	return {
		...base,
		score: {
			fulltime: { home: homeGoals, away: awayGoals },
			halftime: { home: 0, away: 0 },
			extratime: { home: 0, away: 0 },
			penalty: { home: penH, away: penA },
		},
	};
};

const makeFixtureAET = (
	id: number,
	ftHome: number,
	ftAway: number,
	etHome: number,
	etAway: number,
	extra?: Partial<Parameters<typeof makeFixture>[0]>
): Fixture => {
	const base = makeFixture({ id, ...extra, status: 'AET', homeGoals: ftHome + etHome, awayGoals: ftAway + etAway });
	return {
		...base,
		score: {
			fulltime: { home: ftHome, away: ftAway },
			halftime: { home: 0, away: 0 },
			extratime: { home: etHome, away: etAway },
			penalty: { home: null!, away: null! },
		},
	};
};

const makeNotStartedFixture = (id: number, extra?: Partial<Parameters<typeof makeFixture>[0]>): Fixture => {
	const base = makeFixture({ id, ...extra, status: 'NS', homeGoals: null, awayGoals: null });
	return {
		...base,
		fixture: {
			...base.fixture,
			timestamp: Date.now() / 1000 + 7200,
			date: new Date(Date.now() + 7200000).toISOString(),
		},
	};
};

const VIEWER_ID = 'debug-viewer';

interface DebugScenario {
	title: string;
	description: string;
	prediction: Prediction;
	game: Fixture;
	boosted?: boolean;
	odds?: { home: number; away: number; draw: number };
}

// Penalty bonus requires getOutcome(prediction) === getOutcome(penalty).
// In a PEN game the result after ET is always a draw, so exact score (draw)
// can never also earn penalty bonus. Penalty bonus only pairs with one-score or wrong.
const scenarios: DebugScenario[] = [
	{
		title: 'Exact Score',
		description: 'Prediction matches the final result exactly. Awards maximum points (green).',
		prediction: { home: 2, away: 1 },
		game: makeFixture({
			id: 80001,
			homeGoals: 2,
			awayGoals: 1,
			homeId: 1,
			homeName: 'Brazil',
			awayId: 25,
			awayName: 'Germany',
		}),
	},
	{
		title: 'Correct Result',
		description: 'Correct winner predicted but wrong score. Awards result points (yellow).',
		prediction: { home: 3, away: 0 },
		game: makeFixture({
			id: 80002,
			homeGoals: 2,
			awayGoals: 1,
			homeId: 2,
			homeName: 'England',
			awayId: 5,
			awayName: 'Spain',
		}),
	},
	{
		title: 'One Correct Score',
		description: "One team's score matches but wrong winner/result. Awards partial points (pink).",
		prediction: { home: 2, away: 0 },
		game: makeFixture({
			id: 80003,
			homeGoals: 2,
			awayGoals: 2,
			homeId: 6,
			homeName: 'France',
			awayId: 27,
			awayName: 'Portugal',
		}),
	},
	{
		title: 'Wrong Prediction',
		description: 'Nothing matches — wrong winner, wrong scores. No points awarded (red).',
		prediction: { home: 3, away: 0 },
		game: makeFixture({
			id: 80004,
			homeGoals: 0,
			awayGoals: 2,
			homeId: 10,
			homeName: 'Netherlands',
			awayId: 3,
			awayName: 'Italy',
		}),
	},
	{
		title: 'No Prediction',
		description: 'User did not submit a prediction. Shows invalid state with red border.',
		prediction: { home: null!, away: null! },
		game: makeFixture({
			id: 80005,
			homeGoals: 1,
			awayGoals: 0,
			homeId: 9,
			homeName: 'Croatia',
			awayId: 15,
			awayName: 'Mexico',
		}),
	},
	{
		title: 'One Score + Penalty Winner',
		description: 'One score matches + predicted who wins penalties. Pink background + gray +1 badge.',
		prediction: { home: 2, away: 1 },
		game: makeFixturePEN(80006, 1, 1, 4, 2, {
			homeId: 26,
			homeName: 'Argentina',
			awayId: 6,
			awayName: 'France',
			round: 'Final',
			venue: 'Lusail Iconic Stadium',
			city: 'Lusail',
		}),
	},
	{
		title: 'Wrong + Penalty Winner',
		description: 'Wrong prediction but correctly guessed penalty winner. Red background + gray +1 badge.',
		prediction: { home: 3, away: 0 },
		game: makeFixturePEN(80007, 1, 1, 4, 2, {
			homeId: 1,
			homeName: 'Brazil',
			awayId: 9,
			awayName: 'Croatia',
			round: 'Quarter-finals',
		}),
	},
	{
		title: 'Exact Score (PEN game)',
		description:
			"Exact draw score in a penalty game. Green background, no penalty badge (draw prediction can't match a penalty winner).",
		prediction: { home: 1, away: 1 },
		game: makeFixturePEN(80008, 1, 1, 4, 2, {
			homeId: 2,
			homeName: 'England',
			awayId: 6,
			awayName: 'France',
			round: 'Semi-finals',
		}),
	},
	{
		title: 'Exact Score + Upset Bonus',
		description: 'Exact score on an upset pick — predicted underdog wins. Green + cyan +2 badge top-left.',
		prediction: { home: 0, away: 1 },
		game: makeFixture({
			id: 80009,
			homeGoals: 0,
			awayGoals: 1,
			homeId: 1,
			homeName: 'Brazil',
			awayId: 15,
			awayName: 'Mexico',
		}),
		odds: { home: 1.5, away: 5.0, draw: 3.5 },
	},
	{
		title: 'Correct Result + Upset Bonus',
		description: 'Correct result on an underdog pick. Yellow + cyan +2 badge.',
		prediction: { home: 0, away: 2 },
		game: makeFixture({
			id: 80010,
			homeGoals: 0,
			awayGoals: 1,
			homeId: 5,
			homeName: 'Spain',
			awayId: 22,
			awayName: 'Japan',
		}),
		odds: { home: 1.5, away: 5.0, draw: 3.5 },
	},
	{
		title: 'Upset Pick (Pre-Game)',
		description: 'Before kickoff — prediction qualifies as upset pick. Shows "Upset pick" cyan pill at top center.',
		prediction: { home: 0, away: 1 },
		game: makeNotStartedFixture(80011, { homeId: 6, homeName: 'France', awayId: 15, awayName: 'Mexico' }),
		odds: { home: 1.5, away: 5.0, draw: 3.5 },
	},
	{
		title: 'Exact Score + 2x Boost',
		description: 'Exact score on a boosted prediction. Green + 2x indigo badge at the bottom.',
		prediction: { home: 2, away: 1 },
		game: makeFixture({
			id: 80012,
			homeGoals: 2,
			awayGoals: 1,
			homeId: 25,
			homeName: 'Germany',
			awayId: 10,
			awayName: 'Netherlands',
		}),
		boosted: true,
	},
	{
		title: 'Correct Result + 2x Boost',
		description: 'Correct result with boost active. Yellow background + 2x badge.',
		prediction: { home: 3, away: 0 },
		game: makeFixture({
			id: 80013,
			homeGoals: 2,
			awayGoals: 1,
			homeId: 27,
			homeName: 'Portugal',
			awayId: 4,
			awayName: 'Belgium',
		}),
		boosted: true,
	},
	{
		title: 'Wrong + 2x Boost',
		description: 'Wrong prediction but boosted — boost points are wasted. Red background + 2x badge.',
		prediction: { home: 3, away: 0 },
		game: makeFixture({
			id: 80014,
			homeGoals: 0,
			awayGoals: 2,
			homeId: 2,
			homeName: 'England',
			awayId: 3,
			awayName: 'Italy',
		}),
		boosted: true,
	},
	{
		title: 'Exact + Upset + Boost',
		description: 'Maximum combo — exact score on an upset pick with 2x boost. Green + cyan +2 + 2x badge.',
		prediction: { home: 0, away: 1 },
		game: makeFixture({
			id: 80015,
			homeGoals: 0,
			awayGoals: 1,
			homeId: 1,
			homeName: 'Brazil',
			awayId: 22,
			awayName: 'Japan',
		}),
		boosted: true,
		odds: { home: 1.5, away: 5.0, draw: 3.5 },
	},
	{
		title: 'Penalty Winner + Boost',
		description: 'Correctly guessed penalty winner with boost active. Red (wrong score) + gray +1 + 2x.',
		prediction: { home: 0, away: 2 },
		game: makeFixturePEN(80016, 1, 1, 3, 5, {
			homeId: 5,
			homeName: 'Spain',
			awayId: 15,
			awayName: 'Mexico',
			round: 'Semi-finals',
		}),
		boosted: true,
	},
	{
		title: 'Draw Prediction (Exact)',
		description: 'Predicted a draw and it was a draw with the exact score. Green background.',
		prediction: { home: 0, away: 0 },
		game: makeFixture({
			id: 80017,
			homeGoals: 0,
			awayGoals: 0,
			homeId: 9,
			homeName: 'Croatia',
			awayId: 4,
			awayName: 'Belgium',
		}),
	},
	{
		title: 'Draw Prediction (Correct Result)',
		description: 'Predicted a draw — it was a draw but different score. Yellow background.',
		prediction: { home: 1, away: 1 },
		game: makeFixture({
			id: 80018,
			homeGoals: 0,
			awayGoals: 0,
			homeId: 10,
			homeName: 'Netherlands',
			awayId: 26,
			awayName: 'Argentina',
		}),
	},
	{
		title: 'AET — Exact Score',
		description: 'After extra time — prediction matches fulltime + extra time combined score. Green background.',
		prediction: { home: 2, away: 1 },
		game: makeFixtureAET(80019, 1, 1, 1, 0, {
			homeId: 27,
			homeName: 'Portugal',
			awayId: 9,
			awayName: 'Croatia',
			round: 'Round of 16',
		}),
	},
	{
		title: 'AET — Correct Result',
		description: 'After extra time — predicted the right winner but wrong score. Yellow background.',
		prediction: { home: 3, away: 0 },
		game: makeFixtureAET(80020, 1, 1, 1, 0, {
			homeId: 25,
			homeName: 'Germany',
			awayId: 2,
			awayName: 'England',
			round: 'Quarter-finals',
		}),
	},
	{
		title: 'High Scoring Match',
		description: 'Exact score on a high-scoring game. Demonstrates the card handles large numbers.',
		prediction: { home: 5, away: 4 },
		game: makeFixture({
			id: 80021,
			homeGoals: 5,
			awayGoals: 4,
			homeId: 6,
			homeName: 'France',
			awayId: 5,
			awayName: 'Spain',
		}),
	},
];

const noop = async () => {};

const DebugCardGallery = () => {
	const { gcc } = useCompetition();
	const [ready, setReady] = useState(false);

	useEffect(() => {
		const prevCompetition = useTournamentStore.getState().competition;

		const debugFixtures: Fixtures = {};
		const debugOdds: Record<number, { home: number; away: number; draw: number }> = {};
		const boostedIds: number[] = [];

		for (const s of scenarios) {
			const id = s.game.fixture.id;
			debugFixtures[id] = s.game;
			if (s.odds) debugOdds[id] = s.odds;
			if (s.boosted) boostedIds.push(id);
		}

		useTournamentStore.setState(prev => ({
			competition: competitions.wc2026,
			fixtures: { ...prev.fixtures, ...debugFixtures },
			odds: { ...prev.odds, ...debugOdds },
			boosts: { ...prev.boosts, [VIEWER_ID]: boostedIds },
		}));

		setReady(true);

		return () => {
			const ids = scenarios.map(s => s.game.fixture.id);
			useTournamentStore.setState(prev => {
				const fixtures = { ...prev.fixtures };
				const odds = { ...prev.odds };
				for (const id of ids) {
					delete fixtures[id];
					delete odds[id];
				}
				const boosts = { ...prev.boosts };
				delete boosts[VIEWER_ID];
				return { competition: prevCompetition, fixtures, odds, boosts };
			});
		};
	}, []);

	if (!ready) return null;

	const competition = competitions.wc2026;

	const predictions: Predictions = {};
	for (const s of scenarios) {
		predictions[s.game.fixture.id] = { [VIEWER_ID]: s.prediction };
	}

	return (
		<div className={classNames(gcc('text-light'), 'mx-2 pb-8 md:mx-24 lg:mx-48')}>
			<div className='mb-6 mt-4'>
				<h1 className='text-xl font-bold'>Debug Card Gallery</h1>
				<p className='mt-1 text-sm text-gray-400'>
					All prediction result card variants using {competition.name} point system (exact=
					{competition.points.exact}, result={competition.points.result}, onescore=
					{competition.points.onescore}, penalty={competition.points.penalty}, upset=
					{competition.points.upset ?? 0}).
				</p>
			</div>

			<div className='flex flex-col gap-6'>
				{scenarios.map(s => (
					<div key={s.game.fixture.id}>
						<div className='mb-1 px-1'>
							<span className='text-sm font-bold'>{s.title}</span>
							<span className='ml-2 text-xs text-gray-400'>{s.description}</span>
						</div>
						<Game
							predictions={predictions}
							gameID={s.game.fixture.id}
							updatePrediction={noop}
							userID={VIEWER_ID}
						/>
					</div>
				))}
			</div>
		</div>
	);
};

export default DebugCardGallery;
