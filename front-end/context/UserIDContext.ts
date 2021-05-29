import { createContext } from 'react';

const UserContext = createContext<{ uid: string; token: string } | null>(null);

export default UserContext;
