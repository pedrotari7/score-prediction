import { TrashIcon } from '@heroicons/react/24/outline';
import React, { MouseEventHandler, useState } from 'react';
import { classNames } from '../lib/utils/reactHelper';
import Loading from './Loading';

const DeleteButton = ({ className, onClick }: { className: string; onClick: MouseEventHandler<HTMLDivElement> }) => {
	const [confirm, setConfirm] = useState(false);
	const [loading, setLoading] = useState(false);

	return (
		<div>
			{!confirm && (
				<TrashIcon
					className={classNames('h-5 w-5 opacity-80 hover:opacity-100', className)}
					onClick={e => {
						e.stopPropagation();
						setConfirm(true);
					}}
				/>
			)}

			{confirm && (
				<div className={classNames('flex flex-row gap-2', className)}>
					<div
						className="flex items-center justify-center py-2 px-4 rounded-md w-20 h-10 bg-red-800"
						onClick={async e => {
							e.stopPropagation();
							setLoading(true);
							await onClick(e);
							setLoading(false);
						}}>
						{loading ? <Loading /> : <span>delete</span>}
					</div>
					<div
						className="flex items-center justify-center py-2 px-4 rounded-md w-20 h-10 bg-slate-600"
						onClick={e => {
							e.stopPropagation();
							setConfirm(false);
						}}>
						cancel
					</div>
				</div>
			)}
		</div>
	);
};

export default DeleteButton;
