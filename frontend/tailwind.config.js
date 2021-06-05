module.exports = {
	purge: {
		content: ['./pages/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],

		options: {
			safelist: [],
		},
	},
	darkMode: false,
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
				pink: '#e89ba0',
				red: '#9b0808',
				ok: '#bbf3bb',
				warn: '#ffffbb',
				error: '#ffbbbb',
			},
			boxShadow: {
				pop: '0px 2px 40px rgba(0, 0, 0, 0.33)',
				panel: '0px 2px 4px rgba(0, 0, 0, 0.33)',
			},
			height: {
				panel: 'calc(100vh - 4rem)',
			},
		},
	},
	variants: {
		extend: {},
	},
	plugins: [],
};
