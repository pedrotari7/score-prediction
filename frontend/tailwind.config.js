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
			keyframes: {
				'pop-in': {
					'0%': { transform: 'scale(0.5)', opacity: '0' },
					'60%': { transform: 'scale(1.15)', opacity: '1' },
					'100%': { transform: 'scale(1)', opacity: '1' },
				},
				'fade-slide-up': {
					'0%': { transform: 'translateY(8px)', opacity: '0' },
					'100%': { transform: 'translateY(0)', opacity: '1' },
				},
				'fade-in': {
					'0%': { opacity: '0' },
					'100%': { opacity: '1' },
				},
				shimmer: {
					'100%': { transform: 'translateX(100%)' },
				},
				'bounce-in': {
					'0%': { transform: 'scale(0.3)', opacity: '0' },
					'50%': { transform: 'scale(1.2)' },
					'100%': { transform: 'scale(1)', opacity: '1' },
				},
			},
			animation: {
				'pop-in': 'pop-in 0.4s ease-out',
				'fade-slide-up': 'fade-slide-up 0.35s ease-out both',
				'fade-in': 'fade-in 0.3s ease-out both',
				shimmer: 'shimmer 1.5s infinite',
				'bounce-in': 'bounce-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
			},
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

				wc2026: '#3a0a5e',
				'dark-wc2026': '#2a0745',
				'blue-wc2026': '#3a0a5e',
				'light-wc2026': '#e1eded',
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
