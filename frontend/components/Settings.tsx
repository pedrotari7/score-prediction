import { useContext } from 'react';
import UserContext from '../context/UserContext';
import { resetFixtures, resetStandings, updatePoints, cleanup } from '../pages/api';

const Settings = () => {
	const userInfo = useContext(UserContext);

	if (!userInfo) return <></>;

	return (
		<div className="flex flex-col sm:flex-row items-center justify-center sm:h-96">
			<button
				onClick={() => resetStandings(userInfo.token)}
				className="bg-dark text-white font-bold py-2 px-4 rounded m-5">
				Fetch Rankings
			</button>
			<button
				onClick={() => resetFixtures(userInfo.token)}
				className="bg-dark text-white font-bold py-2 px-4 rounded m-5">
				Fetch Fixtures
			</button>

			<button
				onClick={() => updatePoints(userInfo.token)}
				className="bg-dark text-white font-bold py-2 px-4 rounded m-5">
				Update Points
			</button>

			<button
				onClick={() => cleanup(userInfo.token)}
				className="bg-dark text-white font-bold py-2 px-4 rounded m-5">
				Cleanup
			</button>
		</div>
	);
};

export default Settings;
