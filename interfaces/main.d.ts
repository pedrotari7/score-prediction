export interface Prediction {
	home: string;
	away: string;
}

export interface Predictions {
	[key: string]: Record<string, Prediction>;
}
