import { initializeApp } from 'firebase-admin/app';
import { FieldValue, Timestamp, getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import type { UserRecord } from 'firebase-admin/auth';
import type { Competition } from '../../../interfaces/main';

export const firebaseApp = initializeApp();

export const getDbDoc = (comp: Competition, name: string) => getFirestore(firebaseApp).collection(comp.name).doc(name);
export const getDoc = (collection: string, name: string) => getFirestore(firebaseApp).collection(collection).doc(name);

export const getDBFixtures = (competition: Competition) => getDbDoc(competition, 'fixtures');
export const getDBFixturesExtraInfo = (competition: Competition) => getDbDoc(competition, 'fixturesExtraInfo');
export const getDBStandings = (competition: Competition) => getDbDoc(competition, 'standings');
export const getDBPredictions = (competition: Competition) => getDbDoc(competition, 'predictions');
export const getDBScores = (competition: Competition) => getDbDoc(competition, 'scores');
export const getDBGroupPoints = (competition: Competition) => getDbDoc(competition, 'groupPoints');
export const getDBOdds = (competition: Competition) => getDbDoc(competition, 'odds');
export const getDBBoosts = (competition: Competition) => getDbDoc(competition, 'boosts');
export const getDBSettings = () => getDoc('admin', 'settings');
export const getDBUser = (uid: string) => getDoc('users', uid);

export const listAllUsers = async () => {
  const allUsers: UserRecord[] = [];
  let pageToken: string | undefined;
  do {
    const result = await getAuth(firebaseApp).listUsers(1000, pageToken);
    allUsers.push(...result.users);
    pageToken = result.pageToken;
  } while (pageToken);
  return allUsers;
};

export const updateLastCheckIn = async (uid: string): Promise<void> => {
  await getDBUser(uid).set({ lastCheckIn: FieldValue.serverTimestamp() }, { merge: true });
};

export { getFirestore, getAuth, FieldValue, Timestamp };
