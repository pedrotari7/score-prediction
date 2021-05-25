import fetcher from '../../lib/fetcher';
import { backendUrl } from '../../lib/utils/envHelper';

const API_FIXTURES = `${backendUrl}/fixtures`;

const fetchFixtures = async (token: string) => await fetcher(API_FIXTURES, token);

export default fetchFixtures;
