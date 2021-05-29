import fetcher from '../../lib/fetcher';
import { backendUrl } from '../../lib/utils/envHelper';

const API_RESET_FIXTURES = `${backendUrl}/fetch-fixtures`;

const resetFixtures = async (token: string) => await fetcher(API_RESET_FIXTURES, token);

export default resetFixtures;
