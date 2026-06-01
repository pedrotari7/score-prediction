import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
	return (
		<Html lang='en'>
			<Head>
				<link rel='manifest' href='/manifest.json' />
				<meta name='theme-color' content='#1e3a5f' />
				<meta name='apple-mobile-web-app-capable' content='yes' />
				<meta name='apple-mobile-web-app-status-bar-style' content='black-translucent' />
				<meta name='apple-mobile-web-app-title' content='ScorePred' />
				<link rel='apple-touch-icon' href='/apple-touch-icon.png' />
			</Head>
			<body>
				<Main />
				<NextScript />
			</body>
		</Html>
	);
}
