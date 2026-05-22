import { DateTime } from 'luxon';
import type { Competition, Venue } from '../../../interfaces/main';
import { competitions } from '../../../shared/utils';

export const classNames = (...classes: string[]) => classes.filter(Boolean).join(' ');

export const getCurrentDate = () => {
	return DateTime.now();
	// Mocked date
	// return DateTime.fromISO('2021-06-16T19:00:00+0000');
	// return DateTime.fromISO('2016-06-09T19:00:00+0000');
};

export const formatScore = (goal: number | null) => {
	if (typeof goal === 'number' && goal >= 0) return goal;
	if (typeof goal === 'number' && goal < 0) return 'H';
	return 'X';
};

const STADIUMS: Record<string, string> = {
	amsterdam: '/stadiums/amsterdam.webp',
	baku: '/stadiums/baku.webp',
	bucureşti: '/stadiums/bucureşti.webp',
	budapest: '/stadiums/budapest.webp',
	copenhagen: '/stadiums/copenhagen.webp',
	københavn: '/stadiums/copenhagen.webp',
	glasgow: '/stadiums/glasgow.webp',
	london: '/stadiums/london.webp',
	münchen: '/stadiums/münchen.webp',
	roma: '/stadiums/roma.webp',
	saintpetersburg: '/stadiums/saintpetersburg.webp',
	'st.petersburg': '/stadiums/saintpetersburg.webp',
	sevilla: '/stadiums/seville.webp',
	seville: '/stadiums/seville.webp',
	albaytstadium: '/stadiums/albaytstadium.webp',
	khalifainternationalstadium: '/stadiums/khalifa.webp',
	althumamastadium: 'stadiums/al-thumana.webp',
	ahmadbinalistadium: 'stadiums/ahmad.webp',
	lusailiconicstadium: 'stadiums/lusailstadium.webp',
	educationcitystadium: 'stadiums/education.webp',
	stadium974: 'stadiums/974.webp',
	aljanoubstadium: 'stadiums/al-janoub.webp',
	ahmedbinalistadium: 'stadiums/ahmad.webp',
};

export const getStadiumImageURL = (venue: Venue) => {
	const nameUrl = venue.name ? STADIUMS[venue.name.toLocaleLowerCase().replace(/\s/g, '')] : undefined;
	const cityUrl = venue.city ? STADIUMS[venue.city.toLocaleLowerCase().replace(/\s/g, '')] : undefined;
	return nameUrl || cityUrl;
};

export const DEFAULT_IMAGE = '/default-player.png';

export const getContrastYIQ = (hexcolor: string) => {
	hexcolor = hexcolor.startsWith('#') ? hexcolor.replace('#', '') : hexcolor;
	const r = parseInt(hexcolor.substr(0, 2), 16);
	const g = parseInt(hexcolor.substr(2, 2), 16);
	const b = parseInt(hexcolor.substr(4, 2), 16);
	const yiq = (r * 299 + g * 587 + b * 114) / 1000;
	return yiq >= 128 ? 'black' : 'white';
};

export const zip = <T>(a: T[], b: T[]) => a.map((k, i) => [k, b[i]]);

const VALID_COMPETITIONS: string[] = [
	competitions.euro2020.name,
	competitions.wc2022.name,
	competitions.euro2024.name,
	competitions.ca2024.name,
	competitions.wc2026.name,
];

export const getCompetitionClass = (competition: Competition, primitive?: string) =>
	VALID_COMPETITIONS.some(c => c === competition?.name) && primitive
		? `${primitive}-${competition?.name}`
		: competition?.name;

export const GROUP_COLORS: Record<string, string> = {
	A: 'bg-red-600',
	B: 'bg-orange-600',
	C: 'bg-yellow-600',
	D: 'bg-lime-600',
	E: 'bg-green-600',
	F: 'bg-teal-600',
	G: 'bg-indigo-600',
	H: 'bg-pink-600',
	I: 'bg-cyan-600',
	J: 'bg-violet-600',
	K: 'bg-amber-600',
	L: 'bg-emerald-600',
};
