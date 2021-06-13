import { ReactNode, useEffect, useState } from 'react';

const ClientOnly = ({ children }: { children: ReactNode }) => {
	const [hasMounted, setHasMounted] = useState(false);
	useEffect(() => {
		setHasMounted(true);
	}, []);

	return hasMounted ? <>{children}</> : null;
};

export default ClientOnly;
