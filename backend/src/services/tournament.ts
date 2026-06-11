/* eslint-disable @stylistic/ts/indent */

import { Timestamp } from 'firebase-admin/firestore';
import type { DecodedIdToken } from 'firebase-admin/auth';
import type {
  Competition,
  Fixture,
  Fixtures,
  GroupPoints,
  Predictions,
  Settings,
  Standing,
  UserResult,
  FixtureOdds,
} from '../../../interfaces/main';
import {
  calculateResults,
  calculateUserResultPoints,
  competitions,
  currentCompetitions,
  DEFAULT_USER_RESULT,
  getResult,
  isGroupStage,
  isNum,
  isUpsetResult,
  joinResults,
  sortGroup,
  sortWorldCupGroup,
} from '../../../shared/utils';
import {
  FieldValue,
  getDBBoosts,
  getDBFixtures,
  getDBFixturesExtraInfo,
  getDBGroupPoints,
  getDBOdds,
  getDBPredictions,
  getDBScores,
  getDBStandings,
  listAllUsers,
} from '../lib/firebase';
import {
  getStandings as apiGetStandings,
  getFixtures as apiGetFixtures,
  getFullFixture,
  getOdds as apiGetOdds,
} from '../lib/api-sports';

export const isDevMode = process.env.ISDEV;

export const STALE_TIME = 60 * 60 * 4;
export const GAME_TIME = 60 * 1;
export const ODDS_STALE_TIME = 60 * 60 * 3;

export const getCurrentTime = () => {
  return new Date();
  // Mocked date
  // return new Date('2022-12-20T17:00:00+0000');
  // return new Date('2021-06-11T19:00:00+0000');
  // return new Date('2016-06-09T19:00:00+0000');
};

export const getTimeDiff = (timestamp: Timestamp) => {
  return (getCurrentTime().getTime() - timestamp?.toMillis()) / 1000;
};

export const logDev = (message?: unknown, ...optionalParams: unknown[]): void => {
  if (isDevMode) console.log(message, optionalParams);
};

if (isDevMode) console.log('[hot-reload-test] Backend functions loaded at', new Date().toISOString());

export const updateStandings = async (competition: Competition) => {
  const response = await apiGetStandings({ league: competition.league, season: competition.season });

  if (response.status !== 200) return null;

  const standings =
    competition.name !== competitions.euro2016.name
      ? response.data.response?.[0]?.league.standings
      : response.data.response?.[0]?.league.standings[1];

  const standsObj =
    competition.name !== competitions.euro2016.name
      ? standings.reduce((acc: Record<string, unknown>, stand: Array<Standing>) => {
          return { ...acc, [stand[0].group]: stand };
        }, {})
      : standings.reduce((acc: Record<string, Standing[]>, stand: Standing) => {
          if (!acc[stand.group]) acc[stand.group] = [];
          acc[stand.group].push(stand);
          return acc;
        }, {});

  await getDBStandings(competition).set({ data: standsObj, timestamp: FieldValue.serverTimestamp() });
  return standsObj;
};

export const updateFixtures = async (competition: Competition, gamesToUpdate: number[], oldFixtures: Fixtures = {}) => {
  if (gamesToUpdate.length === 0) {
    const response = await apiGetFixtures({
      league: competition.league,
      season: competition.season,
      from: competition.start,
      to: competition.end,
    });

    if (response.status !== 200) return {};

    const fixtures: Fixture[] = response.data.response;
    const fixtureMap = fixtures.reduce(
      (acc, game) => ({ ...acc, [game.fixture.id]: { ...oldFixtures[game.fixture.id], ...game } }),
      {} as Fixtures
    );

    await getDBFixtures(competition).set({ data: fixtureMap, timestamp: FieldValue.serverTimestamp() });
    return fixtureMap;
  } else {
    for (const gameID of gamesToUpdate) {
      const fullFixture = await getFullFixture(gameID);
      if (!fullFixture) return oldFixtures;

      const { fixture, teams, league, goals, score, events, lineups, statistics, players } = fullFixture;

      const extraInfo = { events, lineups, statistics, players };

      oldFixtures[gameID] = { fixture, teams, league, goals, score };

      await getDBFixturesExtraInfo(competition).collection(`${gameID}`).doc('extra').set(extraInfo, { merge: true });
    }

    await getDBFixtures(competition).set({ data: oldFixtures, timestamp: FieldValue.serverTimestamp() });

    return oldFixtures;
  }
};

export const updateOdds = async (competition: Competition, fixtures: Fixtures): Promise<FixtureOdds> => {
  const doc = await getDBOdds(competition).get();
  const odds: FixtureOdds = ((doc.exists ? doc.data()?.data : {}) as FixtureOdds) ?? {};

  const fixtureIds = new Set(Object.values(fixtures).map(f => f.fixture.id));

  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const response = await apiGetOdds({
      league: competition.league,
      season: competition.season,
      page,
    });

    if (response.status !== 200) break;
    totalPages = response.data.paging?.total ?? 1;

    for (const item of response.data.response) {
      const fixtureId = item.fixture.id;
      if (!fixtureIds.has(fixtureId)) continue;

      const bookmaker = item.bookmakers?.[0];
      if (!bookmaker) continue;

      const matchWinner = bookmaker.bets.find((b: { id: number }) => b.id === 1);
      if (!matchWinner) continue;

      const home = parseFloat(matchWinner.values.find((v: { value: string }) => v.value === 'Home')?.odd);
      const away = parseFloat(matchWinner.values.find((v: { value: string }) => v.value === 'Away')?.odd);
      const draw = parseFloat(matchWinner.values.find((v: { value: string }) => v.value === 'Draw')?.odd);

      if (!isNaN(home) && !isNaN(away) && !isNaN(draw)) {
        odds[fixtureId] = { home, away, draw };
      }
    }

    page++;
  }

  await getDBOdds(competition).set({ data: odds, timestamp: FieldValue.serverTimestamp() });

  return odds;
};

export const updatePoints = async (competition: Competition, predictions: Predictions, fixtures: Fixtures) => {
  const hasUpset = (competition.points.upset ?? 0) > 0;

  const [groupPointsDoc, oddsDoc, boostsDoc] = await Promise.all([
    getDBGroupPoints(competition).get(),
    hasUpset ? getDBOdds(competition).get() : Promise.resolve(null),
    getDBBoosts(competition).get(),
  ]);

  const groupPoints = (groupPointsDoc.data() as GroupPoints) ?? {};
  const fixtureOdds: FixtureOdds = ((oddsDoc?.exists ? oddsDoc.data()?.data : {}) as FixtureOdds) ?? {};
  const allBoosts = (boostsDoc.exists ? boostsDoc.data() : {}) as Record<string, number[]>;

  const updatedScores = Object.entries(predictions).reduce(
    (users, [gameID, gamePredictions]) => {
      const game = fixtures[parseInt(gameID)];

      if (!game) return users;

      const stage = isGroupStage(game) ? 'Groups' : game.league.round;
      const upset = hasUpset && isUpsetResult(game, fixtureOdds);

      for (const user in gamePredictions) {
        if (!(user in users)) {
          users[user] = { all: { ...DEFAULT_USER_RESULT } };
        }
        if (!(stage in users[user])) {
          users[user][stage] = { ...DEFAULT_USER_RESULT };
        }
        if (game?.fixture.status.short === 'NS') continue;
        const gameResult = getResult(gamePredictions[user], game, upset);
        users[user][stage] = joinResults(users[user][stage], gameResult);
        users[user]['all'] = joinResults(users[user]['all'], gameResult);

        const userBoosts = allBoosts[user] ?? [];
        if (userBoosts.includes(parseInt(gameID))) {
          const boostBonus = calculateUserResultPoints(gameResult, competition);
          users[user][stage] = joinResults(users[user][stage], { boost: boostBonus });
          users[user]['all'] = joinResults(users[user]['all'], { boost: boostBonus });
        }
      }
      return users;
    },
    {} as Record<string, Record<string, UserResult>>
  );

  for (const user in updatedScores) {
    updatedScores[user]['all'].groups = 0;
    updatedScores[user]['all'].points = 0;

    for (const stage in updatedScores[user]) {
      if (stage.includes('Group')) {
        updatedScores[user][stage].groups = groupPoints[user] ?? 0;
        updatedScores[user]['all'].groups += groupPoints[user] ?? 0;
      }

      updatedScores[user][stage].points = calculateUserResultPoints(updatedScores[user][stage], competition);
    }
    updatedScores[user]['all'].points = calculateUserResultPoints(updatedScores[user]['all'], competition);
  }

  await getDBScores(competition).set(updatedScores);

  return updatedScores;
};

export const updateGroups = async (
  competition: Competition,
  predictions: Predictions,
  fixtures: Fixtures,
  standings: Record<string, Standing[]>
) => {
  const users = Object.values(predictions).reduce((acc, p) => new Set([...acc, ...Object.keys(p)]), new Set<string>());

  const validUsers = [...users.values()];

  const groupPoints: Record<string, number> = validUsers.reduce((acc, user) => ({ ...acc, [user]: 0 }), {});

  for (const user of validUsers) {
    const teamsResults = calculateResults(Object.values(fixtures), predictions, user);

    const validGroups = Object.entries(standings)
      .filter(([name]) => name.includes('Group'))
      .map(([_, g]) => g);

    for (const group of validGroups) {
      const isGroupFinished = group.map(t => t.all.played).every(played => played === 3);

      if (isGroupFinished) {
        const teamsIDs = group.map(t => t.team.id);

        const sortFn = competition.league === 1 ? sortWorldCupGroup : sortGroup;
        const sortedGroup = sortFn(teamsIDs, teamsResults, fixtures, predictions, user);

        groupPoints[user] += sortedGroup.reduce((total, teamId, idx) => total + (teamId === teamsIDs[idx] ? 1 : 0), 0);
      }
    }
  }

  await getDBGroupPoints(competition).set(groupPoints);

  return groupPoints;
};

export const getPredictions = async (
  decodedToken: DecodedIdToken,
  competition: Competition,
  fixtures: Fixtures,
  { adminHideScores }: Settings
) => {
  const { uid: callerUID, admin: isAdmin } = decodedToken;

  const document = await getDBPredictions(competition).get();

  const predictions = (document.data() ?? {}) as Predictions;

  logDev('adminHideScores :>> ', adminHideScores);

  if ((adminHideScores && isAdmin) || Object.keys(predictions).length === 0) return predictions;

  const censoredPredictions = Object.entries(predictions).reduce((acc, [gameId, gamePredictions]) => {
    const gameDate = new Date(fixtures?.[parseInt(gameId)].fixture.date);
    const isInFuture = gameDate && getCurrentTime() < gameDate;

    if (!isInFuture) {
      acc[gameId] = gamePredictions;
      return acc;
    }

    acc[gameId] = Object.fromEntries(
      Object.entries(gamePredictions).map(([uid, prediction]) => {
        if (uid === callerUID) return [uid, prediction];
        return [
          uid,
          {
            ...prediction,
            ...(isNum(prediction.home) ? { home: -1 } : {}),
            ...(isNum(prediction.away) ? { away: -1 } : {}),
          },
        ];
      })
    );

    return acc;
  }, {} as Predictions);

  return censoredPredictions;
};

export const getUsers = async (
  competition: Competition,
  cachedPoints: Record<string, Record<string, UserResult>> | undefined,
  callerUID?: string
) => {
  const scores =
    cachedPoints ?? ((await getDBScores(competition).get()).data() as Record<string, Record<string, UserResult>>) ?? {};

  const authUsers = await listAllUsers();
  const allUsers = authUsers.reduce((users, { uid, displayName, photoURL, customClaims, metadata }) => {
    const isNewUser = metadata.creationTime === metadata.lastSignInTime;

    const lastSignInTimeDiff = getTimeDiff(Timestamp.fromDate(new Date(metadata.lastSignInTime)));

    const OneMonth = 60 * 60 * 24 * 31;

    const isCurrentCompetition = currentCompetitions.some(current => competition.name === current.name);

    if (uid !== callerUID && !(uid in scores) && !(isCurrentCompetition && lastSignInTimeDiff < OneMonth)) {
      return users;
    }
    const score = (scores && scores[uid]) ?? {};
    const admin = customClaims?.admin as boolean;

    const shouldOnboard = isNewUser || lastSignInTimeDiff > OneMonth;

    const name = displayName?.split(' ').shift() ?? 'Unknown User';

    return { ...users, [uid]: { uid, displayName: name, photoURL, admin, score, isNewUser, shouldOnboard } };
  }, {});

  return allUsers;
};
