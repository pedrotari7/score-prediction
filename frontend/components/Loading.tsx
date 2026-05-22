import Image from 'next/image';
import { classNames } from '../lib/utils/reactHelper';

const Loading = ({ className = '', message }: { className?: string; message?: string }) => (
	<div className={classNames('flex size-full flex-col items-center justify-center text-white', className)}>
		<div className='text-3xl'>{message}</div>
		<Image src='/loader.svg' width={48} height={48} alt='' />
	</div>
);

export default Loading;
