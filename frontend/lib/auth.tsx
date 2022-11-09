import { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import nookies from 'nookies';
import { User as FirebaseUser, getAuth } from 'firebase/auth';
import { app } from './firebaseClient';

type User = (FirebaseUser & { admin?: boolean }) | null;

export const AuthContext = createContext<{ user: User }>({ user: null });

export const AuthProvider = ({ children }: { children: ReactNode }) => {
	const [user, setUser] = useState<User>(null);

	const setCookie = (token: string) =>
		nookies.set(null, 'token', token, { path: '/', sameSite: 'Lax', maxAge: 40 * 24 * 60 * 60 });

	useEffect(() => {
		if (typeof window !== 'undefined') {
			/* eslint-disable @typescript-eslint/no-explicit-any */
			(window as any).nookies = nookies;
		}

		const auth = getAuth(app);

		return auth.onIdTokenChanged(async (user: User) => {
			if (!user) {
				setUser(null);
				nookies.destroy(null, 'token');
				setCookie('');
				return;
			}

			const isAdmin = (await user.getIdTokenResult()).claims.admin;

			const token = await user.getIdToken();

			setUser({ ...user, admin: isAdmin });
			nookies.destroy(null, 'token');
			setCookie(token);
		});
	}, []);

	// force refresh the token every 10 minutes
	// useEffect(() => {
	// 	const handle = setInterval(async () => {
	// 		const user = getAuth(app).currentUser;
	// 		if (user) {
	// 			await user.getIdToken(true);
	// 			const token = await user.getIdToken();
	// 			const isAdmin = (await user.getIdTokenResult()).claims.admin;
	// 			setUser({ ...user, admin: isAdmin });
	// 			nookies.destroy(null, 'token');
	// 			setCookie(token);
	// 		}
	// 	}, 1000 * 60 * 10);
	// 	return () => clearInterval(handle);
	// }, []);

	return <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
	return useContext(AuthContext);
};
