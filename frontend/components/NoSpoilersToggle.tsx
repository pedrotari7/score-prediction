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
				'flex flex-col items-center justify-between gap-2 rounded-md py-2 text-xs font-bold sm:py-4',
				'cursor-pointer'
			)}
		>
			<Switch
				onChange={setNoSpoilers}
				onColor='#181a1b'
				uncheckedIcon={
					<div className='flex size-full items-center justify-center'>
						<EyeIcon strokeWidth={2} className='size-4 text-white' />
					</div>
				}
				checkedIcon={
					<div className='flex size-full items-center justify-center'>
						<EyeSlashIcon strokeWidth={2} className='size-4 text-white' />
					</div>
				}
				checked={noSpoilers ?? false}
				// eslint-disable-next-line tailwindcss/no-custom-classname
				className='react-switch'
			/>
			<span>No Spoilers</span>
		</label>
	);
};

export default NoSpoilersToggle;
