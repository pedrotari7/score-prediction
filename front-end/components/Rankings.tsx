export interface User {
	admin: boolean;
	displayName: string;
	email: string;
	photoURL: string;
	score: UserResult;
	uid: string;
}

export interface Users {
	[key: string]: User;
}
export interface UserResult {
	exact: number;
	onescore: number;
	points: number;
	result: number;
	groups: number;
}

const Rankings = ({ users }: { users: Users }) => {
	return (
		<div className="flex justify-center m-6 p-6 shadow-pop rounded-md bg-dark">
			<table className="text-light text-center">
				<thead>
					<tr className="text-left">
						<th></th>
						<th>Exact</th>
						<th>Correct Result</th>
						<th>Team Score</th>
						<th>Groups</th>
						<th>Points</th>
					</tr>
				</thead>

				<tbody>
					{Object.values(users).map(user => {
						return (
							<tr key={user.uid}>
								<td className="flex flex-row items-center mr-4">
									<img className="object-cover h-8 w-8 rounded-full mr-2" src={user.photoURL} />
									<span>{user.displayName}</span>
								</td>
								<td>{user.score.exact}</td>
								<td>{user.score.result}</td>
								<td>{user.score.onescore}</td>
								<td>{user.score.groups}</td>
								<td>{user.score.points}</td>
							</tr>
						);
					})}
				</tbody>
			</table>
		</div>
	);
};

export default Rankings;
