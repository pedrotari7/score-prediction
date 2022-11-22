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
						className="flex h-10 w-20 items-center justify-center rounded-md bg-red-800 py-2 px-4"
						onClick={async e => {
							e.stopPropagation();
							setLoading(true);
							await onClick(e);
							setLoading(false);
						}}
					>
						{loading ? <Loading /> : <span>delete</span>}
					</div>
					<div
						className="flex h-10 w-20 items-center justify-center rounded-md bg-slate-600 py-2 px-4"
						onClick={e => {
							e.stopPropagation();
							setConfirm(false);
						}}
					>
						cancel
					</div>
				</div>
			)}
		</div>
	);
};

export default DeleteButton;
