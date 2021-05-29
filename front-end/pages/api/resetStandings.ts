import fetcher from '../../lib/fetcher';
import { backendUrl } from '../../lib/utils/envHelper';

const API_RESET_STANDINGS = `${backendUrl}/fetch-standings`;

const resetStandings = async (token: string) => await fetcher(API_RESET_STANDINGS, token);

export default resetStandings;
