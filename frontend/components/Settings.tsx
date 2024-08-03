import { Fragment, useContext, useState } from 'react';
import fileDownload from 'js-file-download';
import { buildStyles, CircularProgressbar } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { Listbox, Transition } from '@headlessui/react';

import UserContext from '../context/UserContext';
import {
	resetFixtures,
	resetStandings,
	updatePoints,
	cleanup,
	fetchPredictions,
	fetchUsers,
	updateGroups,
	fetchTournament,
	fetchLeaderboards,
} from '../pages/api';
import type { Competition } from '../../interfaces/main';
import { competitions, currentCompetition } from '../../shared/utils';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/24/outline';
import { getCompetitionClass } from '../lib/utils/reactHelper';
import useSettings from '../hooks/useSettings';
import Loading from './Loading';
import useStatus from '../hooks/useStatus';
import RefreshButton from './RefreshButton';

const SettingsPage = () => {
	const userInfo = useContext(UserContext);
	const [response, setResponse] = useState({});
	const [competition, setCompetition] = useState<Competition>(currentCompetition);

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
					onClick={() => cleanup(userInfo.token, competition)}
					className={`m-5 rounded bg-dark px-4 py-2 font-bold text-white`}
				>
					Cleanup
				</button>
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
