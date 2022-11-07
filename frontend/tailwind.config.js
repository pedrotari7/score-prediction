/** @type {import('tailwindcss').Config} */

module.exports = {
	mode: 'jit',
	content: ['./pages/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './safelist.txt'],

	darkMode: 'media',
	theme: {
		fontFamily: {
			sans: ['PFBeauSansPro'],
		},
		extend: {
			colors: {
				transparent: 'transparent',

				dark: '#015E6C',
				blue: '#3292a4',
				light: '#e1eded',
				ok: '#bbf3bb',
				warn: '#ffffbb',
				error: '#ffbbbb',

				'dark-euro2016': '#015E6C',
				'blue-euro2016': '#3292a4',
				'light-euro2016': '#e1eded',

				'dark-euro2020': '#015E6C',
				'blue-euro2020': '#3292a4',
				'light-euro2020': '#e1eded',

				'dark-wc2022': '#6c2035',
				'blue-wc2022': '#8a1538',
				'light-wc2022': '#e1eded',
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
