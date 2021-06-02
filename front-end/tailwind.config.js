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
				dark: '#015E6C',
				blue: '#3292a4',
				light: '#e1eded',
				pink: '#e89ba0',
				red: '#9b0808',
			},
			boxShadow: {
				pop: '0px 2px 40px rgba(0, 0, 0, 0.33)',
				panel: '0px 2px 4px rgba(0, 0, 0, 0.33)',
			},
		},
	},
	variants: {
		extend: {},
	},
	plugins: [],
};
