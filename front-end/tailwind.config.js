module.exports = {
	purge: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
	darkMode: false, // or 'media' or 'class'
	theme: {
		extend: {},
		colors: {
			transparent: 'transparent',
			dark: '#2e282aff',
			blue: '#3292a4ff',
			light: '#e1ededff',
			pink: '#e89ba0ff',
			red: '#9b0808ff',
		},
	},
	variants: {
		extend: {},
	},
	plugins: [],
};
