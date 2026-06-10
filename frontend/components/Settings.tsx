import { Fragment, useState } from 'react';
import fileDownload from 'js-file-download';
import { buildStyles, CircularProgressbar } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { Listbox, Transition } from '@headlessui/react';

import { Route, useTournamentStore } from '../store/tournamentStore';
import {
	resetFixtures,
	resetStandings,
	updatePoints,
	cleanup,
	fetchPredictions,
	fetchUsers,
	updateGroups,
	fetchOdds,
	fetchOddsLive,
	fetchTournament,
	fetchLeaderboards,
	initCompetition,
	migrateLeaderboardTokens,
	updateFixtureScore,
	fetchMissingSignups,
	type MissingSignupsResult,
} from '../pages/api';
import type { Competition } from '../../interfaces/main';
import { competitions, currentCompetition } from '../../shared/utils';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/24/outline';
import { getCompetitionClass } from '../lib/utils/reactHelper';
import useSettings from '../hooks/useSettings';
import Loading from './Loading';
import useStatus from '../hooks/useStatus';
import RefreshButton from './RefreshButton';
import PwaInstallPrompt from './PwaInstallPrompt';

const FIXTURE_STATUSES = ['NS', '1H', 'HT', '2H', 'ET', 'BT', 'PEN', 'FT', 'AET', 'INT', 'PST'];

const FixtureEditor = ({ token }: { token: string }) => {
	const fixtures = useTournamentStore(s => s.fixtures);
	const competition = useTournamentStore(s => s.competition);
	const [selectedGame, setSelectedGame] = useState<number | null>(null);
	const [home, setHome] = useState(0);
	const [away, setAway] = useState(0);
	const [status, setStatus] = useState('FT');
	const [saving, setSaving] = useState(false);
	const [result, setResult] = useState('');

	const sortedFixtures = Object.values(fixtures).sort((a, b) => a.fixture.timestamp - b.fixture.timestamp);

	const selectGame = (gameId: number) => {
		const game = fixtures[gameId];
		setSelectedGame(gameId);
		setHome(game?.goals?.home ?? 0);
		setAway(game?.goals?.away ?? 0);
		setStatus(game?.fixture?.status?.short ?? 'NS');
	};

	const handleSave = async () => {
		if (!selectedGame) return;
		setSaving(true);
		setResult('');
		const res = await updateFixtureScore(token, competition, selectedGame, home, away, status);
		setResult(res.success ? 'Saved' : res.error || 'Error');
		setSaving(false);
		setTimeout(() => setResult(''), 3000);
	};

	return (
		<div className='mx-10 my-6 rounded-md bg-gray-600 p-4'>
			<span className='mb-3 block text-lg font-bold'>Edit Fixture Score</span>
			<div className='flex flex-col gap-3'>
				<select
					className='rounded bg-gray-700 p-2 text-white'
					value={selectedGame ?? ''}
					onChange={e => selectGame(Number(e.target.value))}
				>
					<option value='' disabled>
						Select a fixture
					</option>
					{sortedFixtures.map(game => (
						<option key={game.fixture.id} value={game.fixture.id}>
							{game.teams.home.name} vs {game.teams.away.name} ({game.fixture.status.short})
						</option>
					))}
				</select>

				{selectedGame && (
					<div className='flex flex-row flex-wrap items-center gap-3'>
						<div className='flex items-center gap-2'>
							<label className='text-sm'>Home</label>
							<input
								type='number'
								min={0}
								value={home}
								onChange={e => setHome(parseInt(e.target.value) || 0)}
								className='w-16 rounded bg-gray-700 p-2 text-center text-white'
							/>
						</div>
						<div className='flex items-center gap-2'>
							<label className='text-sm'>Away</label>
							<input
								type='number'
								min={0}
								value={away}
								onChange={e => setAway(parseInt(e.target.value) || 0)}
								className='w-16 rounded bg-gray-700 p-2 text-center text-white'
							/>
						</div>
						<div className='flex items-center gap-2'>
							<label className='text-sm'>Status</label>
							<select
								value={status}
								onChange={e => setStatus(e.target.value)}
								className='rounded bg-gray-700 p-2 text-white'
							>
								{FIXTURE_STATUSES.map(s => (
									<option key={s} value={s}>
										{s}
									</option>
								))}
							</select>
						</div>
						<button
							onClick={handleSave}
							disabled={saving}
							className='rounded bg-green-600 px-4 py-2 font-bold text-white hover:bg-green-500 disabled:opacity-50'
						>
							{saving ? 'Saving...' : 'Save'}
						</button>
						{result && <span className='text-sm font-bold text-green-400'>{result}</span>}
					</div>
				)}
			</div>
		</div>
	);
};

type SortKey = 'name' | 'email' | 'lastSignIn' | 'created';
type SortDir = 'asc' | 'desc';

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
	{ key: 'lastSignIn', label: 'Last Sign In' },
	{ key: 'name', label: 'Name' },
	{ key: 'email', label: 'Email' },
	{ key: 'created', label: 'Created' },
];

const sortUsers = (users: MissingSignupsResult['data'], key: SortKey, dir: SortDir) => {
	const mult = dir === 'asc' ? 1 : -1;
	return [...users].sort((a, b) => {
		switch (key) {
			case 'name':
				return mult * (a.displayName || '').localeCompare(b.displayName || '');
			case 'email':
				return mult * (a.email || '').localeCompare(b.email || '');
			case 'lastSignIn':
				return mult * (new Date(a.lastSignInTime).getTime() - new Date(b.lastSignInTime).getTime());
			case 'created':
				return mult * (new Date(a.creationTime).getTime() - new Date(b.creationTime).getTime());
			default:
				return 0;
		}
	});
};

const MissingSignups = ({ token, competition }: { token: string; competition: Competition }) => {
	const [result, setResult] = useState<MissingSignupsResult | null>(null);
	const [loading, setLoading] = useState(false);
	const [search, setSearch] = useState('');
	const [sortKey, setSortKey] = useState<SortKey>('lastSignIn');
	const [sortDir, setSortDir] = useState<SortDir>('desc');

	const handleFetch = async () => {
		setLoading(true);
		try {
			setResult(await fetchMissingSignups(token, competition));
		} finally {
			setLoading(false);
		}
	};

	const handleSort = (key: SortKey) => {
		if (sortKey === key) {
			setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
		} else {
			setSortKey(key);
			setSortDir(key === 'name' || key === 'email' ? 'asc' : 'desc');
		}
	};

	const filtered = result?.data.filter(
		u =>
			!search ||
			u.displayName?.toLowerCase().includes(search.toLowerCase()) ||
			u.email?.toLowerCase().includes(search.toLowerCase())
	);

	const sorted = filtered ? sortUsers(filtered, sortKey, sortDir) : [];

	const arrow = (key: SortKey) => (sortKey === key ? (sortDir === 'asc' ? ' ▲' : ' ▼') : '');

	return (
		<div className='mx-4 my-6 rounded-md bg-gray-600 p-4 sm:mx-10'>
			<div className='mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
				<span className='text-lg font-bold'>Missing Signups ({competition.name})</span>
				<button
					onClick={handleFetch}
					disabled={loading}
					className='rounded bg-amber-700 px-4 py-2 font-bold text-white hover:bg-amber-600 disabled:opacity-50'
				>
					{loading ? 'Loading...' : 'Check Missing Signups'}
				</button>
			</div>

			{result && (
				<>
					<div className='mb-4 flex flex-wrap gap-3 text-sm'>
						<span className='rounded bg-gray-700 px-3 py-1'>
							Total: <span className='font-bold'>{result.total}</span>
						</span>
						<span className='rounded bg-green-800 px-3 py-1'>
							Signed up: <span className='font-bold'>{result.signedUp}</span>
						</span>
						<span className='rounded bg-red-800 px-3 py-1'>
							Missing: <span className='font-bold'>{result.missing}</span>
						</span>
					</div>

					{result.data.length > 0 && (
						<>
							<div className='mb-3 flex flex-col gap-2 sm:flex-row sm:items-center'>
								<input
									type='text'
									placeholder='Search by name or email...'
									value={search}
									onChange={e => setSearch(e.target.value)}
									className='w-full rounded bg-gray-700 px-3 py-2 text-sm text-white placeholder-gray-400 sm:w-72'
								/>
								<div className='flex gap-1 sm:hidden'>
									{SORT_OPTIONS.map(({ key, label }) => (
										<button
											key={key}
											onClick={() => handleSort(key)}
											className={`rounded px-2 py-1 text-xs ${
												sortKey === key
													? 'bg-gray-500 font-bold text-white'
													: 'bg-gray-700 text-gray-300'
											}`}
										>
											{label}
											{arrow(key)}
										</button>
									))}
								</div>
							</div>
							<div className='max-h-96 overflow-y-auto rounded bg-gray-700'>
								<table className='w-full text-left text-sm'>
									<thead className='sticky top-0 bg-gray-800 text-xs uppercase text-gray-400'>
										<tr>
											<th
												className='cursor-pointer px-3 py-2 hover:text-white'
												onClick={() => handleSort('name')}
											>
												User{arrow('name')}
											</th>
											<th
												className='hidden cursor-pointer px-3 py-2 hover:text-white sm:table-cell'
												onClick={() => handleSort('email')}
											>
												Email{arrow('email')}
											</th>
											<th
												className='hidden cursor-pointer px-3 py-2 hover:text-white sm:table-cell'
												onClick={() => handleSort('lastSignIn')}
											>
												Last Sign In{arrow('lastSignIn')}
											</th>
											<th
												className='hidden cursor-pointer px-3 py-2 hover:text-white sm:table-cell'
												onClick={() => handleSort('created')}
											>
												Created{arrow('created')}
											</th>
										</tr>
									</thead>
									<tbody>
										{sorted.map(user => (
											<tr key={user.uid} className='border-t border-gray-600'>
												<td className='px-3 py-2'>
													<div className='flex items-center gap-2'>
														{user.photoURL ? (
															<img
																src={user.photoURL}
																alt=''
																className='size-6 rounded-full'
																referrerPolicy='no-referrer'
															/>
														) : (
															<div className='flex size-6 items-center justify-center rounded-full bg-gray-500 text-xs'>
																?
															</div>
														)}
														<div className='flex flex-col'>
															<span>{user.displayName || 'Unknown'}</span>
															<span className='text-xs text-gray-400 sm:hidden'>
																{user.email}
															</span>
														</div>
													</div>
												</td>
												<td className='hidden px-3 py-2 text-gray-300 sm:table-cell'>
													{user.email}
												</td>
												<td className='hidden px-3 py-2 text-gray-400 sm:table-cell'>
													{user.lastSignInTime
														? new Date(user.lastSignInTime).toLocaleDateString()
														: 'Never'}
												</td>
												<td className='hidden px-3 py-2 text-gray-400 sm:table-cell'>
													{user.creationTime
														? new Date(user.creationTime).toLocaleDateString()
														: 'Unknown'}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</>
					)}

					{result.data.length === 0 && <p className='text-sm text-green-400'>Everyone has signed up!</p>}
				</>
			)}
		</div>
	);
};

const SettingsPage = () => {
	const uid = useTournamentStore(s => s.uid);
	const token = useTournamentStore(s => s.token);
	const userInfo = { uid, token };
	const [response, setResponse] = useState({});
	const [competition, setCompetition] = useState<Competition>(currentCompetition);
	const [showPwaPrompt, setShowPwaPrompt] = useState(false);

	const { settings, toggleSetting, loading: loadSettings } = useSettings();

	const { status, loading: loadingStatus, updateStatus } = useStatus();

	if (!userInfo || loadSettings) return <Loading message='Loading settings' />;

	const formattedResponse = JSON.stringify(response, null, 2);

	const gcc = (p: string) => getCompetitionClass(competition, p);

	return (
		<div className={gcc('text-light')}>
			{loadingStatus || !status ? (
				<Loading message='Loading Status' />
			) : (
				<div className='relative m-10 flex flex-row flex-wrap rounded-md bg-gray-500 p-3'>
					<RefreshButton className='absolute bottom-12 right-12 mb-4 size-12' onClick={updateStatus} />
					<a href='https://dashboard.api-football.com/' target='_blank' rel='noreferrer'>
						<img
							className='absolute right-12 mb-4 size-12'
							src='https://dashboard.api-football.com/public/img/api-sports-small-logo.png'
						/>
					</a>

					<div className='m-4 flex w-max flex-col rounded-md bg-gray-600 p-3'>
						<span className='mb-3 text-lg font-bold'>Account</span>
						<span>{`${status.account.firstname} ${status.account.lastname}`}</span>
						<span>{status.account.email}</span>
					</div>

					<div className='m-4 flex w-max flex-col rounded-md bg-gray-600 p-3'>
						<span className='mb-3 text-lg font-bold'>Subscription</span>
						<span>{status.subscription.plan}</span>
						<span>{status.subscription.end}</span>
						<span>{status.subscription.active ? 'Active' : 'Not Active'}</span>
					</div>

					<div className='m-4 flex w-max flex-col rounded-md bg-gray-600 p-3'>
						<span className='mb-3 text-lg font-bold'>Requests</span>
						<CircularProgressbar
							value={status.requests.current}
							maxValue={status.requests.limit_day}
							text={`${status.requests.current}/${status.requests.limit_day}`}
							styles={buildStyles({ textSize: '10px' })}
						/>
					</div>
				</div>
			)}

			<Listbox value={competition} onChange={setCompetition}>
				<div className='relative m-10 mt-1 w-96'>
					<Listbox.Button className='relative w-full cursor-default rounded-lg bg-gray-600 py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm'>
						<span className='block truncate'>{competition.name}</span>
						<span className='pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2'>
							<ChevronUpDownIcon className='size-5 text-gray-400' aria-hidden='true' />
						</span>
					</Listbox.Button>
					<Transition
						as={Fragment}
						leave='transition ease-in duration-100'
						leaveFrom='opacity-100'
						leaveTo='opacity-0'
					>
						<Listbox.Options className='absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-gray-600 py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm'>
							{Object.values(competitions).map(comp => (
								<Listbox.Option
									key={comp.name}
									className={({ active }) =>
										`relative cursor-default select-none py-2 pl-10 pr-4 ${
											active ? 'bg-amber-100 text-amber-900' : 'text-white'
										}`
									}
									value={comp}
								>
									{({ selected }) => (
										<>
											<span
												className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}
											>
												{comp.name}
											</span>
											{selected ? (
												<span className='absolute inset-y-0 left-0 flex items-center pl-3 text-amber-600'>
													<CheckIcon className='size-5' aria-hidden='true' />
												</span>
											) : null}
										</>
									)}
								</Listbox.Option>
							))}
						</Listbox.Options>
					</Transition>
				</div>
			</Listbox>

			<div className='mx-10 my-3 rounded-md bg-gray-600 p-3'>
				<label className='mx-4 mt-3 inline-flex cursor-pointer select-none items-center'>
					<input
						type='checkbox'
						className='size-5'
						checked={settings.adminHideScores}
						onChange={() => toggleSetting('adminHideScores')}
					/>
					<span className='ml-2'>Admin Hide Scores</span>
				</label>
				<label className='mx-4 mt-3 inline-flex cursor-pointer select-none items-center'>
					<input
						type='checkbox'
						className='size-5'
						checked={settings.allowUpdateFixtures}
						onChange={() => toggleSetting('allowUpdateFixtures')}
					/>
					<span className='ml-2'>Allow Update Fixtures</span>
				</label>
				<label className='mx-4 mt-3 inline-flex cursor-pointer select-none items-center'>
					<input
						type='checkbox'
						className='size-5'
						checked={settings.allowUpdateStandings}
						onChange={() => toggleSetting('allowUpdateStandings')}
					/>
					<span className='ml-2'>Allow Update Standings</span>
				</label>
				<label className='mx-4 mt-3 inline-flex cursor-pointer select-none items-center'>
					<input
						type='checkbox'
						className='size-5'
						checked={settings.disableLiveScoresApi}
						onChange={() => toggleSetting('disableLiveScoresApi')}
					/>
					<span className='ml-2'>Disable Live Scores Api</span>
				</label>
				<label className='mx-4 mt-3 inline-flex cursor-pointer select-none items-center'>
					<input
						type='checkbox'
						className='size-5'
						checked={settings.allowUpdatePoints}
						onChange={() => toggleSetting('allowUpdatePoints')}
					/>
					<span className='ml-2'>Allow Update Points</span>
				</label>
				<label className='mx-4 mt-3 inline-flex cursor-pointer select-none items-center'>
					<input
						type='checkbox'
						className='size-5'
						checked={settings.enableMetricsCollection}
						onChange={() => toggleSetting('enableMetricsCollection')}
					/>
					<span className='ml-2'>Enable Metrics Collection</span>
				</label>
			</div>
			<div className='flex flex-col flex-wrap items-center justify-center sm:flex-row'>
				<button
					onClick={async () => setResponse(await fetchTournament(userInfo.token, competition))}
					className={`m-5 rounded bg-dark px-4 py-2 font-bold text-white`}
				>
					Fetch Tournament
				</button>

				<button
					onClick={async () => setResponse(await resetStandings(userInfo.token, competition))}
					className={`m-5 rounded bg-dark px-4 py-2 font-bold text-white`}
				>
					Fetch Leaderboard
				</button>
				<button
					onClick={async () => setResponse(await resetFixtures(userInfo.token, competition))}
					className={`m-5 rounded bg-dark px-4 py-2 font-bold text-white`}
				>
					Fetch Fixtures
				</button>

				<button
					onClick={async () => setResponse(await fetchPredictions(userInfo.token, competition))}
					className={`m-5 rounded bg-dark px-4 py-2 font-bold text-white`}
				>
					Fetch Predictions
				</button>

				<button
					onClick={async () => setResponse(await fetchLeaderboards(userInfo.token))}
					className={`m-5 rounded bg-dark px-4 py-2 font-bold text-white`}
				>
					Fetch Leaderboards
				</button>

				<button
					onClick={async () => setResponse(await fetchUsers(userInfo.token, competition))}
					className={`m-5 rounded bg-dark px-4 py-2 font-bold text-white`}
				>
					Fetch Users
				</button>

				<button
					onClick={async () => setResponse(await updatePoints(userInfo.token, competition))}
					className={`m-5 rounded bg-dark px-4 py-2 font-bold text-white`}
				>
					Update Points
				</button>

				<button
					onClick={async () => setResponse(await updateGroups(userInfo.token, competition))}
					className={`m-5 rounded bg-dark px-4 py-2 font-bold text-white`}
				>
					Update Groups
				</button>

				<button
					onClick={async () => setResponse(await fetchOdds(userInfo.token, competition))}
					className={`m-5 rounded bg-dark px-4 py-2 font-bold text-white`}
				>
					Fetch Odds (DB)
				</button>

				<button
					onClick={async () => setResponse(await fetchOddsLive(userInfo.token, competition))}
					className={`m-5 rounded bg-orange-700 px-4 py-2 font-bold text-white`}
				>
					Fetch Odds (Live)
				</button>

				<button
					onClick={() => cleanup(userInfo.token, competition)}
					className={`m-5 rounded bg-dark px-4 py-2 font-bold text-white`}
				>
					Cleanup
				</button>

				<button
					onClick={async () => setResponse(await migrateLeaderboardTokens(userInfo.token))}
					className={`m-5 rounded bg-dark px-4 py-2 font-bold text-white`}
				>
					Migrate Leaderboard Tokens
				</button>

				<button
					onClick={async () => setResponse(await initCompetition(userInfo.token, competition))}
					className={`m-5 rounded bg-amber-700 px-4 py-2 font-bold text-white`}
				>
					Init Competition
				</button>

				<button
					onClick={() => {
						throw new Error('Test error boundary');
					}}
					className={`m-5 rounded bg-red-700 px-4 py-2 font-bold text-white`}
				>
					Test Error Boundary
				</button>

				<button
					onClick={() => {
						useTournamentStore.getState().setRoute({ page: Route.RefreshPage });
					}}
					className={`m-5 rounded bg-red-700 px-4 py-2 font-bold text-white`}
				>
					Test Refresh Page
				</button>

				<button
					onClick={() => setShowPwaPrompt(true)}
					className={`m-5 rounded bg-red-700 px-4 py-2 font-bold text-white`}
				>
					Test PWA Install Prompt
				</button>

				<button
					onClick={() => useTournamentStore.getState().setRoute({ page: Route.DebugCards })}
					className={`m-5 rounded bg-purple-700 px-4 py-2 font-bold text-white`}
				>
					Debug Card Gallery
				</button>

				<button
					onClick={() => useTournamentStore.getState().setRoute({ page: Route.Metrics })}
					className={`m-5 rounded bg-teal-700 px-4 py-2 font-bold text-white`}
				>
					Metrics Dashboard
				</button>
			</div>

			<PwaInstallPrompt forceShow={showPwaPrompt} onDismiss={() => setShowPwaPrompt(false)} />

			<MissingSignups token={userInfo.token} competition={competition} />

			<FixtureEditor token={userInfo.token} />

			<div className='mx-10 my-6 rounded-md bg-gray-600 p-4'>
				<span className='mb-3 block text-lg font-bold'>App Version</span>
				<div className='flex flex-col gap-1 text-sm text-gray-300'>
					<span>
						<span className='text-gray-400'>Commit: </span>
						<code className='rounded bg-gray-700 px-1.5 py-0.5 text-xs'>
							{process.env.NEXT_PUBLIC_APP_ENV === 'local-dev'
								? 'dev'
								: (process.env.NEXT_PUBLIC_GIT_COMMIT_HASH ?? 'unknown')}
						</code>
					</span>
					<span>
						<span className='text-gray-400'>Built: </span>
						{process.env.NEXT_PUBLIC_BUILD_TIMESTAMP
							? new Date(process.env.NEXT_PUBLIC_BUILD_TIMESTAMP).toLocaleString()
							: 'unknown'}
					</span>
				</div>
			</div>

			<div className='m-10 rounded-md bg-gray-700 p-5'>
				<div className='flex flex-row items-center justify-between'>
					<div className='text-xl font-bold'>Response</div>
					<button
						onClick={() =>
							fileDownload(
								formattedResponse,
								`${competition.name}-backup-${new Date().toISOString()}.json`
							)
						}
						className={`m-5 rounded bg-dark px-4 py-2 font-bold text-white`}
					>
						Export
					</button>
				</div>
				<pre className='overflow-x-scroll text-xs'>{formattedResponse}</pre>
			</div>
		</div>
	);
};

export default SettingsPage;
