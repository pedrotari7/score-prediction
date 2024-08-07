import type { Dispatch, SetStateAction } from 'react';
import React from 'react';
import type { Leaderboard, Users } from '../../interfaces/main';
import Select from 'react-select';
import { classNames } from '../lib/utils/reactHelper';
import useCompetition from '../hooks/useCompetition';

const SelectLeaderboard = ({
	users,
	leaderboards,
	setMembers,
	currentLeaderboard,
	setCurrentLeaderboard,
	className,
}: {
	users: Users;
	leaderboards: Record<string, Leaderboard>;
	setMembers: Dispatch<SetStateAction<string[]>>;
	currentLeaderboard: string;
	setCurrentLeaderboard: Dispatch<SetStateAction<string>>;
	className?: string;
}) => {
	const allLeaderboards: Record<string, Leaderboard> = {
		global: { id: 'global', name: 'Global', members: Object.keys(users), creator: 'global' },
		...leaderboards,
	};

	const { competition } = useCompetition();

	const backgroundColor = competition.color;
	return (
		<Select
			className={classNames('w-96 max-w-full', className ?? '')}
			isSearchable={false}
			styles={{
				control: styles => ({
					...styles,
					backgroundColor,
					border: 0,
					outline: '1px solid white',
				}),
				input: styles => ({ ...styles, backgroundColor: 'transparent', color: '#fff' }),
				menu: styles => ({ ...styles, backgroundColor: 'transparent', color: '#fff' }),
				singleValue: styles => ({ ...styles, backgroundColor: 'transparent', color: '#fff' }),

				option: (styles, { isDisabled, isFocused }) => {
					return {
						...styles,
						backgroundColor: isFocused ? '#2b2d2e' : backgroundColor,
						color: '#FFF',
						cursor: isDisabled ? 'not-allowed' : 'pointer',
					};
				},
			}}
			onChange={selectedOption => {
				if (selectedOption) {
					setCurrentLeaderboard(selectedOption.value);
					setMembers(allLeaderboards[selectedOption.value]?.members ?? []);
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
