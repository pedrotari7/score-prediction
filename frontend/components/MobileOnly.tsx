import { ReactNode } from 'react';
import { classNames } from '../lib/utils/reactHelper';

const MobileOnly = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
	<div className={classNames('sm:hidden', className)}>{children}</div>
);
export default MobileOnly;
