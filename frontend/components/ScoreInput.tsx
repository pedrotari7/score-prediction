import { classNames } from '../lib/utils/reactHelper';

const ScoreInput = ({ className, value, onchange = () => {}, disabled = false, id }: any) => (
	<input
		value={value}
		onChange={e => {
			e.stopPropagation();
			e.preventDefault();
			onchange(e);
		}}
		onClick={e => e.stopPropagation()}
		disabled={disabled}
		className={classNames(
			className,
			'block w-14 h-7 text-dark text-center font-bold ',
			'rounded py-3 px-3 leading-tight focus:outline-none focus:bg-white focus:border-gray-500',
			value && !disabled ? 'bg-gray-300' : 'bg-error border-none',
			disabled ? 'bg-transparent border-none outline-none select-none font-bold' : 'border border-gray-200',
			!disabled ? 'hover:bg-gray-100' : ''
		)}
		id={id}
		name={id}
		type="number"
	/>
);

export default ScoreInput;
