module.exports = {
	purge: {
		content: ['./pages/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],

		options: {
			safelist: [],
		},
	},
	darkMode: false,
	theme: {
		extend: {
			colors: {
				transparent: 'transparent',
				dark: '#2e282a',
				blue: '#3292a4',
				light: '#e1eded',
				pink: '#e89ba0',
				red: '#9b0808',
			},
		},
	},
	variants: {
		extend: {},
	},
	plugins: [],
};
