import type { Dispatch, SetStateAction } from 'react';
import React from 'react';
import Select from 'react-select';
import { classNames } from '../lib/utils/reactHelper';
import useCompetition from '../hooks/useCompetition';

const SelectStage = ({
	stages,
	setCurrentStage,
	currentStage,
	className,
}: {
	stages: string[];
	currentStage: string;
	setCurrentStage: Dispatch<SetStateAction<string>>;
	className?: string;
}) => {
	const { competition } = useCompetition();

	const backgroundColor = competition.color;
	return (
		<div className='flex flex-row items-center justify-center gap-8'>
			<span className='font-bold text-zinc-400'>Stages</span>
			<Select
				className={classNames('w-48 max-w-full', className ?? '')}
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
						setCurrentStage(selectedOption.value);
					}
				}}
				value={{
					value: currentStage,
					label: currentStage,
				}}
				options={stages.map(s => ({ value: s, label: s }))}
			/>
		</div>
	);
};

export default SelectStage;
