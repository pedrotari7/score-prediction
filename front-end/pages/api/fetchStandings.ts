import fetcher from '../../lib/fetcher';
import { backendUrl } from '../../lib/utils/envHelper';

const API_STANDINGS = `${backendUrl}/standings`;

const fetchStandings = async (token: string) => await fetcher(API_STANDINGS, token);

export default fetchStandings;
