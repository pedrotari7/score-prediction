import { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { User as FirebaseUser, getAuth } from 'firebase/auth';
import { app } from './firebaseClient';

type User = (FirebaseUser & { token: string; admin?: boolean }) | null | undefined;

export const AuthContext = createContext<{ user: User }>({ user: null });

export const AuthProvider = ({ children }: { children: ReactNode }) => {
	const [user, setUser] = useState<User>(null);

	useEffect(
		() =>
			getAuth(app).onIdTokenChanged(async user => {
				if (!user) {
					setUser(undefined);
					return;
				}

				const token = await user.getIdToken();

				const isAdmin = (await user.getIdTokenResult()).claims.admin as boolean;

				setUser({ ...user, admin: isAdmin, token });
			}),
		[]
	);

	// force refresh the token every 10 minutes
	// useEffect(() => {
	// 	const handle = setInterval(async () => {
	// 		const user = getAuth(app).currentUser;
	// 		console.log('refresh', user);
	// 		if (user) {
	// 			await user.getIdToken(true);
	// 			const token = await user.getIdToken();
	// 			const isAdmin = (await user.getIdTokenResult()).claims.admin;
	// 			setUser({ ...user, admin: isAdmin, token });
	// 		}
	// 	}, 1000 * 60 * 10);
	// 	return () => clearInterval(handle);
	// }, []);

	return <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
