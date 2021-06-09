export interface Prediction {
	home: number;
	away: number;
}

export type GamePredictions = Record<string, Prediction>;

export interface Predictions {
	[key: string]: GamePredictions;
}

export interface Team {
	id: number;
	name: string;
	logo: string;
	winner: null;
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
export interface FixtureData {
	id: number;
	date: string;
	periods: Object;
	referee: Object;
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

export interface Fixture {
	fixture: FixtureData;
	teams: Teams;
	league: League;
	goals: Result;
	score: Score;
}

export interface Fixtures {
	[key: string]: Fixture;
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
