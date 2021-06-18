module.exports = {
	purge: {
		content: ['./pages/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],

		options: {
			safelist: [
				'bg-green-100',
				'bg-red-100',
				'bg-gray-300',
				'w-2/12',
				'sm:w-5/12',
				'w-5/12 ',
				'sm:w-3/12',
				'flex-row-reverse',
				'flex-grow',
				'bg-gray-500',
				'h-0.5',
				'opacity-80',
				'my-6',
				'm-10',
				'left-1/2',
				'transform',
				'-translate-x-1/2',
				'rounded-r-md',
				'rounded-l-md',
				'top-0',
				'-left-2',
				'left-0',
				'm-3',
			],
			keyframes: true,
			fontFace: true,
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
				// pink: '#e89ba0',
				// red: '#9b0808',
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
