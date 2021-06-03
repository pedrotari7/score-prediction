import { useState, useEffect, useContext, createContext } from 'react';
import nookies from 'nookies';
import { firebaseClient } from './firebaseClient';

type User = (firebaseClient.User & { admin?: boolean }) | null;

export const AuthContext = createContext<{ user: User }>({ user: null });

export const AuthProvider = ({ children }: any) => {
	const [user, setUser] = useState<User>(null);

	useEffect(() => {
		if (typeof window !== 'undefined') {
			(window as any).nookies = nookies;
		}
		return firebaseClient.auth().onIdTokenChanged(async (user: User) => {
			if (!user) {
				setUser(null);
				nookies.destroy(null, 'token');
				nookies.set(null, 'token', '', { path: '/' });
				return;
			}

			const isAdmin = (await user.getIdTokenResult()).claims.admin;

			const token = await user.getIdToken();
			setUser({ ...user, admin: isAdmin });
			nookies.destroy(null, 'token');
			nookies.set(null, 'token', token, { path: '/' });
		});
	}, []);

	// force refresh the token every 10 minutes
	useEffect(() => {
		const handle = setInterval(async () => {
			const user = firebaseClient.auth().currentUser;
			if (user) await user.getIdToken(true);
		}, 1000 * 60 * 1000);
		return () => clearInterval(handle);
	}, []);

	return <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
	return useContext(AuthContext);
};
