import { useContext, useState } from 'react';
import UserContext from '../context/UserContext';
import fileDownload from 'js-file-download';
import { resetFixtures, resetStandings, updatePoints, cleanup, fetchPredictions } from '../pages/api';

const Settings = () => {
	const userInfo = useContext(UserContext);
	const [response, setResponse] = useState({});

	if (!userInfo) return <></>;

	const formattedResponse = JSON.stringify(response, null, 2);

	return (
		<div className="text-light">
			<div className="flex flex-col sm:flex-row items-center justify-center">
				<button
					onClick={async () => setResponse(await resetStandings(userInfo.token))}
					className="bg-dark text-white font-bold py-2 px-4 rounded m-5">
					Fetch Rankings
				</button>
				<button
					onClick={async () => setResponse(await resetFixtures(userInfo.token))}
					className="bg-dark text-white font-bold py-2 px-4 rounded m-5">
					Fetch Fixtures
				</button>

				<button
					onClick={async () => setResponse(await fetchPredictions(userInfo.token))}
					className="bg-dark text-white font-bold py-2 px-4 rounded m-5">
					Fetch Predictions
				</button>

				<button
					onClick={async () => setResponse(await updatePoints(userInfo.token))}
					className="bg-dark text-white font-bold py-2 px-4 rounded m-5">
					Update Points
				</button>

				<button
					onClick={() => cleanup(userInfo.token)}
					className="bg-dark text-white font-bold py-2 px-4 rounded m-5">
					Cleanup
				</button>
			</div>

			<div className="bg-gray-700 m-10 rounded-md p-5">
				<div className="flex flex-row items-center justify-between">
					<div className="text-xl font-bold">Response</div>
					<button
						onClick={() => fileDownload(formattedResponse, `backup-${new Date().toISOString()}.json`)}
						className="bg-dark text-white font-bold py-2 px-4 rounded m-5">
						Export
					</button>
				</div>
				<pre className="text-xs overflow-x-scroll">{formattedResponse}</pre>
			</div>
		</div>
	);
};

export default Settings;
