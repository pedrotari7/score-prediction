import { classNames } from '../lib/utils/reactHelper';

const ScoreInput = ({ className, value, onchange = () => {}, disabled = false }: any) => (
	<input
		value={value}
		onChange={onchange}
		onClick={e => e.stopPropagation()}
		disabled={disabled}
		className={classNames(
			className,
			'block w-14 h-7  text-gray-700 text-center',
			'rounded py-3 px-3 leading-tight focus:outline-none focus:bg-white focus:border-gray-500',
			disabled
				? 'bg-transparent text-light border-none outline-none select-none font-bold'
				: 'border  border-gray-200',
			value ? 'bg-gray-300' : 'bg-error border-none'
		)}
		type="text"
	/>
);

export default ScoreInput;
