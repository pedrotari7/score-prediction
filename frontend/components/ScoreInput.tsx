import { ChangeEvent, MutableRefObject, useContext } from 'react';
import { isNum } from '../../shared/utils';
import CompetitionContext from '../context/CompetitionContext';
import { classNames, getCompetitionClass } from '../lib/utils/reactHelper';

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
	const competition = useContext(CompetitionContext);
	const gcc = (p: string) => getCompetitionClass(p, competition);

	return (
		<input
			value={value ?? ''}
			min={0}
			onChange={async e => {
				e.stopPropagation();
				e.preventDefault();
				await onchange(e);
			}}
			onClick={e => e.stopPropagation()}
			onFocus={e => e.target.select()}
			className={classNames(
				className,
				gcc('text-dark'),
				`block h-7 w-14 text-center font-bold hover:bg-gray-100`,
				'rounded py-3 px-3 leading-tight focus:border-gray-500 focus:bg-white focus:outline-none',
				isNum(value) ? 'bg-green-200' : value === null ? 'bg-red-200' : 'bg-gray-100',
				'border border-gray-200'
			)}
			id={id}
			name={id}
			ref={innerRef}
			type='number'
		/>
	);
};

export default ScoreInput;
