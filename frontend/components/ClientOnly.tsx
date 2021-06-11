import { useEffect, useState } from 'react';

const ClientOnly = ({ children }: { children: JSX.Element }) => {
	const [hasMounted, setHasMounted] = useState(false);
	useEffect(() => {
		setHasMounted(true);
	}, []);

	return hasMounted ? <>{children}</> : null;
};

export default ClientOnly;
