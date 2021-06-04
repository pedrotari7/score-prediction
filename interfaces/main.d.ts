export interface Prediction {
	home: string;
	away: string;
}

export interface Predictions {
	[key: string]: Record<string, Prediction>;
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

export interface FixtureData {
	id: number;
	date: string;
	periods: Object;
	referee: Object;
	status: Object;
	timestamp: number;
	timezone: string;
	venue: Venue;
}

export interface Fixture {
	fixture: FixtureData;
	teams: Teams;
	league: League;
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

export interface User {
	admin: boolean;
	displayName: string;
	email: string;
	photoURL: string;
	score: UserResult;
	uid: string;
}

export interface Users {
	[key: string]: User;
}
export interface UserResult {
	exact: number;
	onescore: number;
	points: number;
	result: number;
	groups: number;
}
