import React, { Dispatch, SetStateAction } from 'react';
import { Leaderboard, Users } from '../../interfaces/main';
import Select from 'react-select';

const SelectLeaderboard = ({
	users,
	leaderboards,
	setMembers,
	currentLeaderboard,
	setCurrentLeaderboard,
}: {
	users: Users;
	leaderboards: Record<string, Leaderboard>;
	setMembers: Dispatch<SetStateAction<string[]>>;
	currentLeaderboard: string;
	setCurrentLeaderboard: Dispatch<SetStateAction<string>>;
}) => {
	const allLeaderboards: Record<string, Leaderboard> = {
		global: { id: 'global', name: 'Global', members: Object.keys(users), creator: 'global' },
		...leaderboards,
	};

	return (
		<Select
			className=" text-red-900 w-96 max-w-full"
			onChange={selectedOption => {
				if (selectedOption) {
					setCurrentLeaderboard(selectedOption.value);
					setMembers(allLeaderboards[selectedOption.value].members);
				}
			}}
			value={{
				value: allLeaderboards[currentLeaderboard].id,
				label: allLeaderboards[currentLeaderboard].name,
			}}
			options={Object.values(allLeaderboards).map(l => ({ value: l.id, label: l.name }))}
		/>
	);
};

export default SelectLeaderboard;
