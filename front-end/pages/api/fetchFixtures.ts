import fetcher from '../../lib/fetcher';
import { backendUrl } from '../../lib/utils/envHelper';

const API_FIXTURES = `${backendUrl}/fixtures`;

const fetchFixtures = async () => await fetcher(API_FIXTURES);

export default fetchFixtures;
