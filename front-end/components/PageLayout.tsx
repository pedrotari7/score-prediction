import Head from 'next/head';

const PageLayout = ({ title, children }: { title: string; children: JSX.Element }) => (
	<div className="flex flex-col h-screen">
		<Head>
			<title>{title}</title>
			<link rel="icon" href="/favicon.ico" />
			<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		</Head>
		<main className="flex flex-col h-full">{children}</main>
	</div>
);

export default PageLayout;
