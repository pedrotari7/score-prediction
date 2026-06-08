import { useCallback, useEffect, useMemo, useState } from 'react';
import type { MetricsQueryEvent } from '../../interfaces/main';
import { useTournamentStore } from '../store/tournamentStore';
import { fetchMetricsData } from '../pages/api';
import Loading from './Loading';
import Panel from './Panel';
import useCompetition from '../hooks/useCompetition';
import { classNames } from '../lib/utils/reactHelper';

type TimeRange = '1h' | '6h' | '24h' | '7d' | '30d';

const TIME_RANGES: { label: string; value: TimeRange }[] = [
	{ label: '1h', value: '1h' },
	{ label: '6h', value: '6h' },
	{ label: '24h', value: '24h' },
	{ label: '7d', value: '7d' },
	{ label: '30d', value: '30d' },
];

const EVENT_TYPES = [
	{ label: 'All', value: '' },
	{ label: 'Page Views', value: 'page_view' },
	{ label: 'API Calls', value: 'api_call' },
	{ label: 'Errors', value: 'error' },
	{ label: 'Predictions', value: 'prediction_submitted' },
	{ label: 'Pred. Failures', value: 'prediction_failed' },
	{ label: 'Boosts', value: 'boost_toggled' },
];

const formatTimestamp = (ts: number) => {
	const d = new Date(ts);
	return d.toLocaleString(undefined, {
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
	});
};

const filterByTimeRange = (events: MetricsQueryEvent[], range: TimeRange): MetricsQueryEvent[] => {
	const now = Date.now();
	const ms: Record<TimeRange, number> = {
		'1h': 60 * 60 * 1000,
		'6h': 6 * 60 * 60 * 1000,
		'24h': 24 * 60 * 60 * 1000,
		'7d': 7 * 24 * 60 * 60 * 1000,
		'30d': 30 * 24 * 60 * 60 * 1000,
	};
	const cutoff = now - ms[range];
	return events.filter(e => e.timestamp >= cutoff);
};

const SummaryCard = ({ label, value, color }: { label: string; value: string | number; color: string }) => (
	<div className={classNames('flex flex-col items-center rounded-lg p-3 md:p-4', color)}>
		<span className='text-xl font-bold md:text-2xl'>{value}</span>
		<span className='text-xs text-gray-300'>{label}</span>
	</div>
);

const BarChart = ({ data, label }: { data: Record<string, number>; label: string }) => {
	const max = Math.max(...Object.values(data), 1);
	const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]);

	if (sorted.length === 0) return null;

	return (
		<div className='rounded-lg bg-gray-700 p-3 md:p-4'>
			<span className='mb-3 block text-sm font-bold'>{label}</span>
			<div className='flex flex-col gap-1.5'>
				{sorted.slice(0, 10).map(([name, count]) => (
					<div key={name} className='flex items-center gap-2'>
						<span className='w-20 shrink-0 truncate text-xs text-gray-400 md:w-28'>{name}</span>
						<div className='h-4 flex-1 overflow-hidden rounded-full bg-gray-600'>
							<div
								className='bg-blue-500 h-full rounded-full transition-all'
								style={{ width: `${(count / max) * 100}%` }}
							/>
						</div>
						<span className='w-8 text-right text-xs text-gray-400'>{count}</span>
					</div>
				))}
			</div>
		</div>
	);
};

const EventRow = ({
	event,
	expanded,
	onToggle,
}: {
	event: MetricsQueryEvent;
	expanded: boolean;
	onToggle: () => void;
}) => {
	const eventColors: Record<string, string> = {
		page_view: 'bg-blue-900/40',
		api_call: 'bg-green-900/40',
		error: 'bg-red-900/40',
		prediction_submitted: 'bg-purple-900/40',
		prediction_failed: 'bg-orange-900/40',
		boost_toggled: 'bg-yellow-900/40',
	};

	return (
		<div className={classNames('rounded-md', eventColors[event.name] ?? 'bg-gray-700/40')}>
			<button className='flex w-full items-center gap-2 px-3 py-2 text-left text-sm md:gap-3' onClick={onToggle}>
				<span className='w-28 shrink-0 text-xs text-gray-400 md:w-36'>{formatTimestamp(event.timestamp)}</span>
				<span className='inline-block w-28 shrink-0 truncate rounded bg-gray-600 px-1.5 py-0.5 text-center text-xs font-medium md:w-36'>
					{event.name}
				</span>
				<span className='flex-1 truncate text-xs text-gray-400'>{event.uid.slice(0, 8)}...</span>
				<span className='text-xs text-gray-500'>{expanded ? '▲' : '▼'}</span>
			</button>

			{expanded && (
				<div className='border-t border-gray-600 px-3 py-2 text-xs'>
					<div className='grid grid-cols-1 gap-2 md:grid-cols-2'>
						<div>
							<span className='text-gray-500'>UID: </span>
							<span className='break-all'>{event.uid}</span>
						</div>
						<div>
							<span className='text-gray-500'>Session: </span>
							<span className='break-all'>{event.sessionId}</span>
						</div>
						{event.metadata && (
							<>
								<div>
									<span className='text-gray-500'>Device: </span>
									{event.metadata.device} / {event.metadata.browser} / {event.metadata.os}
								</div>
								<div>
									<span className='text-gray-500'>Viewport: </span>
									{event.metadata.viewport}
								</div>
								<div>
									<span className='text-gray-500'>App Version: </span>
									<code className='rounded bg-gray-700 px-1'>
										{event.metadata.appVersion?.slice(0, 8) ?? 'n/a'}
									</code>
								</div>
							</>
						)}
					</div>
					{event.payload && Object.keys(event.payload).length > 0 && (
						<div className='mt-2'>
							<span className='text-gray-500'>Payload:</span>
							<pre className='mt-1 overflow-x-auto rounded bg-gray-800 p-2 text-xs'>
								{JSON.stringify(event.payload, null, 2)}
							</pre>
						</div>
					)}
				</div>
			)}
		</div>
	);
};

const MetricsDashboard = () => {
	const token = useTournamentStore(s => s.token);
	const { gcc } = useCompetition();

	const [events, setEvents] = useState<MetricsQueryEvent[]>([]);
	const [loading, setLoading] = useState(true);
	const [eventFilter, setEventFilter] = useState('');
	const [timeRange, setTimeRange] = useState<TimeRange>('24h');
	const [expandedId, setExpandedId] = useState<string | null>(null);

	const loadData = useCallback(async () => {
		if (!token) return;
		setLoading(true);

		const dataResult = await fetchMetricsData(token, { limit: 500 });

		setEvents(dataResult.events ?? []);
		setLoading(false);
	}, [token]);

	useEffect(() => {
		loadData();
	}, [loadData]);

	const filteredEvents = useMemo(() => {
		let result = filterByTimeRange(events, timeRange);
		if (eventFilter) result = result.filter(e => e.name === eventFilter);
		return result;
	}, [events, timeRange, eventFilter]);

	const timeFilteredEvents = useMemo(() => filterByTimeRange(events, timeRange), [events, timeRange]);

	const stats = useMemo(() => {
		const byType: Record<string, number> = {};
		const byDevice: Record<string, number> = {};
		const byBrowser: Record<string, number> = {};
		const byPage: Record<string, number> = {};
		const uniqueUsers = new Set<string>();
		const uniqueSessions = new Set<string>();
		let errorCount = 0;

		for (const e of timeFilteredEvents) {
			byType[e.name] = (byType[e.name] ?? 0) + 1;
			if (e.metadata?.device) byDevice[e.metadata.device] = (byDevice[e.metadata.device] ?? 0) + 1;
			if (e.metadata?.browser) byBrowser[e.metadata.browser] = (byBrowser[e.metadata.browser] ?? 0) + 1;
			if (e.name === 'page_view' && e.payload?.page) {
				const page = e.payload.page as string;
				byPage[page] = (byPage[page] ?? 0) + 1;
			}
			if (e.name === 'error') errorCount++;
			uniqueUsers.add(e.uid);
			uniqueSessions.add(e.sessionId);
		}

		return {
			byType,
			byDevice,
			byBrowser,
			byPage,
			uniqueUsers: uniqueUsers.size,
			uniqueSessions: uniqueSessions.size,
			errorCount,
			total: timeFilteredEvents.length,
		};
	}, [timeFilteredEvents]);

	if (loading) return <Loading message='Loading metrics' />;

	return (
		<Panel className='pb-8'>
			<div className='p-4 md:p-6'>
				<div className='mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
					<h1 className='text-xl font-bold md:text-2xl'>Metrics Dashboard</h1>
					<button onClick={loadData} className='rounded bg-gray-600 px-3 py-1.5 text-sm hover:bg-gray-500'>
						Refresh
					</button>
				</div>

				{/* Time range selector */}
				<div className='mb-4 flex flex-wrap gap-2'>
					{TIME_RANGES.map(r => (
						<button
							key={r.value}
							onClick={() => setTimeRange(r.value)}
							className={classNames(
								'rounded px-3 py-1 text-sm',
								timeRange === r.value ? gcc('bg-blue') + ' font-bold' : 'bg-gray-700 hover:bg-gray-600'
							)}
						>
							{r.label}
						</button>
					))}
				</div>

				{/* Summary cards */}
				<div className='mb-6 grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3'>
					<SummaryCard label='Total Events' value={stats.total} color='bg-gray-700' />
					<SummaryCard label='Unique Users' value={stats.uniqueUsers} color='bg-blue-900/50' />
					<SummaryCard label='Sessions' value={stats.uniqueSessions} color='bg-purple-900/50' />
					<SummaryCard
						label='Errors'
						value={stats.errorCount}
						color={stats.errorCount > 0 ? 'bg-red-900/50' : 'bg-gray-700'}
					/>
				</div>

				{/* Charts */}
				<div className='mb-6 grid grid-cols-1 gap-3 md:grid-cols-2'>
					<BarChart data={stats.byType} label='Events by Type' />
					<BarChart data={stats.byPage} label='Page Views' />
					<BarChart data={stats.byDevice} label='Devices' />
					<BarChart data={stats.byBrowser} label='Browsers' />
				</div>

				{/* Event filter */}
				<div className='mb-4 flex flex-wrap gap-2'>
					{EVENT_TYPES.map(t => (
						<button
							key={t.value}
							onClick={() => setEventFilter(t.value)}
							className={classNames(
								'rounded px-2.5 py-1 text-xs',
								eventFilter === t.value
									? gcc('bg-blue') + ' font-bold'
									: 'bg-gray-700 hover:bg-gray-600'
							)}
						>
							{t.label}
						</button>
					))}
				</div>

				{/* Event log */}
				<div className='rounded-lg bg-gray-800/50 p-3'>
					<div className='mb-3 flex items-center justify-between'>
						<span className='text-sm font-bold'>Event Log ({filteredEvents.length})</span>
					</div>
					<div className='flex max-h-[60vh] flex-col gap-1 overflow-y-auto'>
						{filteredEvents.length === 0 ? (
							<div className='py-8 text-center text-sm text-gray-500'>
								No events found for this time range
							</div>
						) : (
							filteredEvents.map(event => (
								<EventRow
									key={event.id}
									event={event}
									expanded={expandedId === event.id}
									onToggle={() => setExpandedId(expandedId === event.id ? null : event.id)}
								/>
							))
						)}
					</div>
				</div>
			</div>
		</Panel>
	);
};

export default MetricsDashboard;
