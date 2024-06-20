import { DateTime } from 'luxon';
import { Competition, Venue } from '../../../interfaces/main';
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
	const nameUrl = STADIUMS[venue.name.toLocaleLowerCase().replace(/\s/g, '')];
	const cityUrl = STADIUMS[venue.city.toLocaleLowerCase().replace(/\s/g, '')];
	const stadiumUrl = nameUrl || cityUrl;
	return stadiumUrl ?? undefined;
};

export const DEFAULT_IMAGE =
	'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFgAAABYCAMAAABGS8AGAAAAkFBMVEVHcEwAAACAgIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAuLi5+fn5+fn5aWlp5eXliYmJoaGhtbW17e3t1dXV8fHx2dnbOzs729vaBgYHa2trv7+/W1tbx8fHR0dGQkJDd3d20tLTk5OTh4eG8vLyenp7Kysrp6enDw8OHh4etra3T09OhoaGnp6eKioqXl5eTk5MLPRlaAAAAFnRSTlMAF/EYCw4VAxIHJtTjRKpTYnC4jcabWgrxJQAABJRJREFUWMO1mXt7qjAMxkEm5xwveNkGlZsgiLe5ff9vd9ICpdCmgrj856y/J3uTpm1iGLL9ofYP7A1sOp3+lQz+SL+ja9hio5cJWAa1qZnc2EcGF9D9sQ3VnK3etx8TUtnkY/u+mpktdh90C2vb1vpzThQ2/1xblC2g+7nLsObSKR2Nv7LTrrJT9hWXrjtLs0I/dLqFtTbM1ziJfK9jfpQw+HxjtdAPuQy7YNSDh1jB2IsSrSczbok1VxSbR57WopyiV2aNRsgCd7al2F2DCIt94DKLglRQZkfR25mWzLm2uYaQxQLW37ktC0Q0CDJZg9MYueRC1GzLAS8y4T8+uJKlwtcZLHdAaYihglxxqQyQC99iyPauwsQFh2/Ij1IOidxwlxC1i6/3l1ohZt8FYrhUkTnXXIK8x1bKqrnutZUfRxB6acpkHjfgnltctRBdl4F8BjKPoJLb2REY1+2sOyjItRD2bCFxfRQceBJ5MbNbYtRca97Rl25cFHzt7kPQeW7V5EYICJwjc70UBbueguxAAGsxuBBryDNvDNiDrFs3YnCBJ+Rbqo8ajRVg/5tMuMwUTDPChLqjKJH9g8cCCBXJZJlBwaXDq3Z9eA5M68aqctkoHbYWJFbW3GFgLyYLq3TZKB3eELJTrgyGgXeEbEqXSzA4nKtPiR0GTtXr89JlCtY6jOcbAuYuM7A5xxwOUSmiEHN5bjIwbDp7SUg00GHX3SMnLCFQjN7eDKqEg6SEJnZY9GhiOFQLCrYmJPEGxg4HJ2RiMTCrEgWySrOlsZ8cWMV4M0CJT1QJjch79Ccx+QQtDJYTCboqxMAh+pOE5YUxtWdoTmhUDjQ3L0Jm9tRg9cfHlxXDFKZxYZUIwO8aiakDQ7ZHJfI7A2/Jlw58GBY6sC+aycZf80NZifXh0zkMVfmDgSfkpL0G7wc67J3IxKRgtLLhm6TQ/gAqHAVbj8DeQCX6g6VK9OAJUYFnD8HSHtm9CBx2nwqh9xopuuErvF8C+/3AeLqFfpoGQXBNu+D0Cn9OUz/Ug5UbJEyDpkh0tkjzEV59Ib5BFFva15x1UgH1kS0NR2mnCIUHd5DtQ2URksqmf3UH2tVXls1OoS8id7BFhVzou0dT6j5lqXQ0dQ7Tvfuk7aXDVDz+w8B92vhGr47/8sJyGM3l5KK6sAhXrHHcmsyvWPxS6EfuSGNtKX4prK+x47mMzK+x9cX7FVxK5hfv+qnwEi6Qm6dC9bhJXgNOmsdN5fL9NeA7f47xB+TlFdxL84DkT97zaTz3dBaevPyR/jMe/CM+0pu2wmW8EK22Am+EnLNx3OwsNkLE1s39OIZ7vLdaN61mU3zETma0DDfcuNNsarXH8uZ87Af2whqdS+2xVkMv58duT7BXofNHrcL8WJ3mvcEUfVRy1U3TAWC0aaps8/YH421eZWO6N1jXmFa10vuC9a10RfO/H/hh818eVyT96vrDcYU8YLk/RCf3PgMWxUjofNPU6NPt3HMkpBxixTdlyctu8YAhFjZ2+7klGXf9lCW3n6Fjt98bFGKjTUccbTpPjTZ/bxj7qvHxf74hHX2Bfx7wAAAAAElFTkSuQmCC';

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
};
