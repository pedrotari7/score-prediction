module.exports = {
	plugins: [require('prettier-plugin-tailwindcss')],
	tailwindConfig: './tailwind.config.js',
	singleQuote: true,
	printWidth: 120,
	trailingComma: 'es5',
	tabWidth: 4,
	semi: true,
	useTabs: true,
	bracketSpacing: true,
	jsxSingleQuote: true,
	jsxBracketSameLine: false,
	arrowParens: 'avoid',
	htmlWhitespaceSensitivity: 'ignore',
	endOfLine: 'lf',
	overrides: [
		{
			files: ['.md'],
			options: {
				proseWrap: 'never',
			},
		},
		{
			files: ['.prettierrc', '.eslintrc'],
			options: {
				parser: 'json',
			},
		},
		{
			files: ['.scssm', '.scss', '.css'],
			options: {
				parser: 'scss',
				htmlWhitespaceSensitivity: 'css',
			},
		},
	],
};
