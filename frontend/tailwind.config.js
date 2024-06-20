/** @type {import('tailwindcss').Config} */

module.exports = {
	mode: 'jit',
	content: ['./pages/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}', './safelist.txt'],

	darkMode: 'media',
	theme: {
		fontFamily: {
			sans: ['PFBeauSansPro'],
		},
		extend: {
			colors: {
				transparent: 'transparent',

				ok: '#bbf3bb',
				warn: '#ffffbb',
				error: '#ffbbbb',

				dark: '#015E6C',
				blue: '#3292a4',
				light: '#e1eded',

				'dark-euro2016': '#015E6C',
				'blue-euro2016': '#3292a4',
				'light-euro2016': '#e1eded',

				euro2020: '#3292a4',
				'dark-euro2020': '#015E6C',
				'blue-euro2020': '#3292a4',
				'light-euro2020': '#e1eded',

				wc2022: '#74122f',
				'dark-wc2022': '#480c1d',
				'blue-wc2022': '#74122f',
				'light-wc2022': '#e1eded',

				euro2024: '#002B93',
				'dark-euro2024': '#143cd9',
				'blue-euro2024': '#002B93',
				'light-euro2024': '#e1eded',

				ca2024: '#123164',
				'dark-ca2024': '#404343',
				'blue-ca2024': '#242525',
				'light-ca2024': '#e1eded',
			},
			boxShadow: {
				pop: '0px 2px 40px rgba(0, 0, 0, 0.33)',
				panel: '0px 2px 4px rgba(0, 0, 0, 0.33)',
			},
			height: {
				panel: 'calc(100vh - 4rem)',
			},
			minWidth: {
				result: '6rem',
			},
		},
	},
	variants: {
		extend: {},
	},
	plugins: [],
};
