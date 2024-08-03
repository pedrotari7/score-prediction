import type { ReactNode } from 'react';
import { classNames } from '../lib/utils/reactHelper';

const DesktopOnly = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
	<div className={classNames('hidden sm:block', className)}>{children}</div>
);

export default DesktopOnly;
