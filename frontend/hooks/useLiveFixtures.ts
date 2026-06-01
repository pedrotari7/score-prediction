import { useEffect } from 'react';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import { app } from '../lib/firebaseClient';
import { useTournamentStore } from '../store/tournamentStore';
import type { Fixtures, Standings } from '../../interfaces/main';

const useLiveFixtures = () => {
	const competition = useTournamentStore(s => s.competition);
	const token = useTournamentStore(s => s.token);
	const loading = useTournamentStore(s => s.loading);

	useEffect(() => {
		if (!token || !competition?.name || loading) return;

		const db = getFirestore(app);

		const unsubFixtures = onSnapshot(
			doc(db, competition.name, 'fixtures'),
			snap => {
				const data = snap.data()?.data as Fixtures | undefined;
				if (data && Object.keys(data).length > 0) {
					useTournamentStore.setState({ fixtures: data });
				}
			},
			err => console.error('Live fixtures listener error:', err)
		);

		const unsubStandings = onSnapshot(
			doc(db, competition.name, 'standings'),
			snap => {
				const data = snap.data();
				if (data?.data) {
					const sortedStandings = Object.entries(data.data).sort();
					useTournamentStore.setState({ standings: sortedStandings as unknown as Standings });
				}
			},
			err => console.error('Live standings listener error:', err)
		);

		return () => {
			unsubFixtures();
			unsubStandings();
		};
	}, [competition?.name, token, loading]);
};

export default useLiveFixtures;
