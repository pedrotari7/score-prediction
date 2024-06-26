import { classNames } from '../lib/utils/reactHelper';

const Loading = ({ className = '', message }: { className?: string; message?: string }) => (
	<div className={classNames('flex size-full flex-col items-center justify-center text-white', className)}>
		<div className='text-3xl'>{message}</div>
		<img className='' src='loader.svg' />
	</div>
);

export default Loading;
