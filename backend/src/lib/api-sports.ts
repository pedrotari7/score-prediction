import { defineSecret } from 'firebase-functions/params';
import axios from 'axios';
import type { Fixture, Status } from '../../../interfaces/main';

export const APISPORTSKEY = defineSecret('APISPORTS');

const API_SPORTS_URL = 'https://v3.football.api-sports.io';

export const buildUrl = (url: string, opts: Record<string, unknown>) =>
  url +
  '?' +
  Object.entries(opts)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');

export const get = async (url: string, opts: Record<string, unknown> = {}) => {
  try {
    return (await axios.get(buildUrl(`${API_SPORTS_URL}/${url}`, opts), {
      headers: {
        'x-rapidapi-host': 'v3.football.api-sports.io',
        'x-rapidapi-key': APISPORTSKEY.value(),
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    })) as any;
  } catch (error: unknown) {
    console.error('API Sports request failed:', error);
    return { status: 0, data: { response: [] } };
  }
};

export const getStandings = async (opts: Record<string, unknown> = {}) => await get('standings', opts);

export const getFixtures = async (opts: Record<string, unknown> = {}) => await get('fixtures', opts);

export const getOdds = async (opts: Record<string, unknown> = {}) => await get('odds', { bet: 1, ...opts });

export const getStatus = async (): Promise<Status> => (await get('status')).data.response;

export const getFullFixture = async (eventID: number, opts: Record<string, unknown> = {}): Promise<Fixture | null> => {
  const fullFixtures = await get('fixtures', { id: eventID, ...opts });

  if (fullFixtures.status !== 200) return null;
  return fullFixtures.data.response.pop();
};
