import type { ChangeEvent, MutableRefObject } from 'react';
import { useState } from 'react';
import { isNum } from '../../shared/utils';
import useCompetition from '../hooks/useCompetition';
import { classNames } from '../lib/utils/reactHelper';

const ScoreInput = ({
	className,
	value,
	onchange = () => {},
	id,
	innerRef,
}: {
	className: string;
	value: number | null;
	onchange: (e: ChangeEvent<HTMLInputElement>) => void;
	id: string;
	innerRef: MutableRefObject<HTMLInputElement | null>;
}) => {
	const { gcc } = useCompetition();
	const [saved, setSaved] = useState(false);

	return (
		<input
			value={value ?? ''}
			min={0}
			max={99}
			onChange={e => {
				e.stopPropagation();
				e.preventDefault();
				const val = parseInt(e.target.value);
				if (!isNaN(val) && (val < 0 || val > 99)) return;
				onchange(e);
				setSaved(true);
				setTimeout(() => setSaved(false), 1000);
			}}
			onClick={e => e.stopPropagation()}
			onFocus={e => e.target.select()}
			className={classNames(
				className,
				gcc('text-dark'),
				`block h-12 w-16 text-center font-bold hover:bg-gray-100 sm:h-11 sm:w-14`,
				'rounded p-3 leading-tight focus:border-gray-500 focus:bg-white focus:outline-none',
				'border border-gray-200 transition-colors duration-300',
				saved
					? 'border-emerald-400 !bg-emerald-300'
					: isNum(value)
						? 'bg-green-200'
						: value === null
							? 'bg-red-200'
							: 'bg-gray-100'
			)}
			id={id}
			name={id}
			ref={innerRef}
			type='number'
		/>
	);
};

export default ScoreInput;
