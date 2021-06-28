import { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import nookies from 'nookies';
import { firebaseClient } from './firebaseClient';

type User = (firebaseClient.User & { admin?: boolean }) | null;

export const AuthContext = createContext<{ user: User }>({ user: null });

export const AuthProvider = ({ children }: { children: ReactNode }) => {
	const [user, setUser] = useState<User>(null);

	useEffect(() => {
		if (typeof window !== 'undefined') {
			/* eslint-disable @typescript-eslint/no-explicit-any */
			(window as any).nookies = nookies;
		}
		return firebaseClient.auth().onIdTokenChanged(async (user: User) => {
			if (!user) {
				setUser(null);
				nookies.destroy(null, 'token');
				nookies.set(null, 'token', '', { path: '/', sameSite: 'Lax' });
				return;
			}

			const isAdmin = (await user.getIdTokenResult()).claims.admin;

			const token = await user.getIdToken();

			setUser({ ...user, admin: isAdmin });
			nookies.destroy(null, 'token');
			nookies.set(null, 'token', token, { path: '/', sameSite: 'Lax' });
		});
	}, []);

	// force refresh the token every 10 minutes
	useEffect(() => {
		const handle = setInterval(async () => {
			const user = firebaseClient.auth().currentUser;
			if (user) {
				await user.getIdToken(true);
				const token = await user.getIdToken();
				const isAdmin = (await user.getIdTokenResult()).claims.admin;
				setUser({ ...user, admin: isAdmin });
				nookies.destroy(null, 'token');
				nookies.set(null, 'token', token, { path: '/', sameSite: 'Lax' });
			}
		}, 1000 * 60 * 10);
		return () => clearInterval(handle);
	}, []);

	return <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
	return useContext(AuthContext);
};
