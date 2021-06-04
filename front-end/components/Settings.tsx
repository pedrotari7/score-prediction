import { useContext } from 'react';
import UserContext from '../context/UserContext';
import { resetFixtures, resetStandings } from '../pages/api';

const Settings = () => {
	const userInfo = useContext(UserContext);

	if (!userInfo) return <></>;

	return (
		<div className="flex flex-row items-center justify-center h-96">
			<button
				onClick={() => resetStandings(userInfo.token)}
				className="bg-dark text-white font-bold py-2 px-4 rounded mr-5">
				Fetch Rankings
			</button>
			<button
				onClick={() => resetFixtures(userInfo.token)}
				className="bg-dark text-white font-bold py-2 px-4 rounded mr-5">
				Fetch Fixtures
			</button>
		</div>
	);
};

export default Settings;
