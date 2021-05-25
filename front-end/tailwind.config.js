module.exports = {
	purge: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
	darkMode: false, // or 'media' or 'class'
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
