import fetcher from '../../lib/fetcher';
import { backendUrl } from '../../lib/utils/envHelper';

const API_STANDINGS = `${backendUrl}/standings`;

const fetchStandings = async () => await fetcher(API_STANDINGS);

export default fetchStandings;
