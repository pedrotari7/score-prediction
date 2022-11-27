import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import Switch from 'react-switch';
import React from 'react';
import 'react-toggle/style.css'; // for ES6 modules
import useNoSpoilers from '../hooks/useNoSpoilers';
import { classNames } from '../lib/utils/reactHelper';

const NoSpoilersToggle = () => {
	const { noSpoilers, setNoSpoilers } = useNoSpoilers();

	return (
		<label
			className={classNames(
				'flex flex-col items-center justify-between gap-2 rounded-md p-2 text-xs font-bold sm:p-4',
				'cursor-pointer'
			)}
		>
			<Switch
				onChange={setNoSpoilers}
				uncheckedIcon={
					<div className='flex h-full w-full items-center justify-center'>
						<EyeIcon strokeWidth={2} className='h-4 w-4 text-white' />
					</div>
				}
				checkedIcon={
					<div className='flex  h-full w-full items-center justify-center'>
						<EyeSlashIcon strokeWidth={2} className='h-4 w-4 text-white' />
					</div>
				}
				checked={noSpoilers}
				className='react-switch'
			/>
		</label>
	);
};

export default NoSpoilersToggle;
