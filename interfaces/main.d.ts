export interface Prediction {
	home: number;
	away: number;
}

export type GamePredictions = Record<string, Prediction>;

export interface Predictions {
	[key: string]: GamePredictions;
}

export interface PlayerColors {
	primary: string;
	number: string;
	border: string;
}
export interface TeamColors {
	player: PlayerColors;
	goalkeeper: PlayerColors;
}

export interface Team {
	id: number;
	name: string;
	logo: string;
	winner: null;
	colors: TeamColors;
}

export interface Teams {
	away: Team;
	home: Team;
}

export interface Venue {
	city: string;
	id: number;
	name: string;
}

export interface League {
	country: string;
	flag: string;
	id: number;
	logo: string;
	name: string;
	round: string;
	season: number;
}

export interface FixtureStatus {
	elapsed: number;
	long: string;
	short: string;
}

export interface Player {
	id: number;
	name: string;
	photo: string;
}

export interface Event {
	time: { elapsed: number; extra: null };
	team: Team;
	player: Player;
	assist: Player;
	type: 'Goal' | 'Card' | 'subst' | 'var';
	detail: string;
	comments: string;
}

export interface LineupPlayer {
	id: number;
	name: string;
	number: number;
	pos: string;
	grid: string;
}

export interface Coach {
	id: number;
	name: string;
	photo: string;
}

export type LineupPlayers = { player: LineupPlayer }[];

export interface Lineup {
	team: Team;
	formation: string;
	startXI: LineupPlayers;
	substitutes: LineupPlayers;
	coach: Coach;
}

export interface Stat {
	type: string;
	value: number | string | null;
}

export interface Statistic {
	team: Team;
	statistics: Stat[];
}
export interface FixtureData {
	id: number;
	date: string;
	periods: { first: number; second: number };
	referee: string;
	status: FixtureStatus;
	timestamp: number;
	timezone: string;
	venue: Venue;
}

export interface Result {
	home: number;
	away: number;
}

export interface Score {
	extratime: Result;
	fulltime: Result;
	halftime: Result;
	penalty: Result;
}

export interface PlayerInfo {
	player: Player;
	statistics: Array<Object>;
}
export interface PlayersInfo {
	team: Team;
	players: PlayerInfo[];
}

export type PlayersMap = Record<number, Record<number, Player>>;

export interface Fixture {
	fixture: FixtureData;
	teams: Teams;
	league: League;
	goals: Result;
	score: Score;
	events: Event[];
	lineups: Lineup[];
	statistics?: Statistic[];
	players?: PlayersInfo[];
}

export interface Fixtures {
	[key: number]: Fixture;
}

export interface Goals {
	against: number;
	for: number;
	lose: number;
	played: number;
	win: number;
}
export interface Tally {
	win: number;
	played: number;
	lose: number;
	draw: number;
	goals: Goals;
}

export interface Standing {
	description: string;
	form: string;
	goalsDiff: number;
	group: string;
	points: number;
	rank: number;
	status: string;
	update: string;
	team: Team;
	all: Tally;
	home: Tally;
	away: Tally;
}

export type Standings = [string, any][];

export interface User extends Record<string, any> {
	admin: boolean;
	displayName: string;
	photoURL: string;
	score: UserResult;
	uid: string;
	isNewUser: boolean;
}

export interface Users {
	[key: string]: User;
}
export interface UserResult extends Record<string, number> {
	exact: number;
	onescore: number;
	points: number;
	result: number;
	fail: number;
	groups: number;
}

export interface Competition {
	name: string;
	league: number;
	season: number;
}

export type Competitions = Record<string, Competition>;

export interface Tournament {
	fixtures: Fixtures;
	standings: Standings;
	predictions: Predictions;
	users: Users;
}
