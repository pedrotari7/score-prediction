import { classNames } from '../lib/utils/reactHelper';

const ScoreInput = ({ className, value, onchange = () => {}, id, innerRef }: any) => (
	<input
		value={value ?? ''}
		onChange={e => {
			e.stopPropagation();
			e.preventDefault();
			onchange(e);
		}}
		onClick={e => e.stopPropagation()}
		className={classNames(
			className,
			'block w-14 h-7 text-dark text-center font-bold hover:bg-gray-100',
			'rounded py-3 px-3 leading-tight focus:outline-none focus:bg-white focus:border-gray-500',
			value === null ? ' bg-red-100 border-none' : typeof value === 'number' ? 'bg-green-100' : 'bg-gray-300',
			'border border-gray-200'
		)}
		id={id}
		name={id}
		ref={innerRef}
		type="number"
	/>
);

export default ScoreInput;
