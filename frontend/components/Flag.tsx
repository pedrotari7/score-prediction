import { Team } from '../../interfaces/main';
import { classNames } from '../lib/utils/reactHelper';

const Flag = ({ className = '', team }: { team: Team; className?: string }) => {
	return (
		<div className={classNames(className, 'flex items-center justify-center')}>
			<img className='mx-2 h-5 w-7' src={FLAGS[team?.id]} />
		</div>
	);
};

export default Flag;

const FLAGS: Record<number, string> = {
	1: 'https://upload.wikimedia.org/wikipedia/commons/9/92/Flag_of_Belgium_%28civil%29.svg',
	2: 'https://upload.wikimedia.org/wikipedia/en/c/c3/Flag_of_France.svg',
	3: 'https://upload.wikimedia.org/wikipedia/commons/1/1b/Flag_of_Croatia.svg',
	4: 'https://upload.wikimedia.org/wikipedia/en/f/f3/Flag_of_Russia.svg',
	5: 'https://upload.wikimedia.org/wikipedia/en/4/4c/Flag_of_Sweden.svg',
	9: 'https://upload.wikimedia.org/wikipedia/en/9/9a/Flag_of_Spain.svg',
	10: 'https://upload.wikimedia.org/wikipedia/en/b/be/Flag_of_England.svg',
	15: 'https://upload.wikimedia.org/wikipedia/commons/f/f3/Flag_of_Switzerland.svg',
	18: 'https://upload.wikimedia.org/wikipedia/commons/c/ce/Flag_of_Iceland.svg',
	21: 'https://upload.wikimedia.org/wikipedia/commons/9/9c/Flag_of_Denmark.svg',
	24: 'https://upload.wikimedia.org/wikipedia/en/1/12/Flag_of_Poland.svg',
	25: 'https://upload.wikimedia.org/wikipedia/en/b/ba/Flag_of_Germany.svg',
	27: 'https://upload.wikimedia.org/wikipedia/commons/5/5c/Flag_of_Portugal.svg',
	767: 'https://upload.wikimedia.org/wikipedia/commons/d/dc/Flag_of_Wales.svg',
	768: 'https://upload.wikimedia.org/wikipedia/en/0/03/Flag_of_Italy.svg',
	769: 'https://upload.wikimedia.org/wikipedia/commons/c/c1/Flag_of_Hungary.svg',
	770: 'https://upload.wikimedia.org/wikipedia/commons/c/cb/Flag_of_the_Czech_Republic.svg',
	771: 'https://upload.wikimedia.org/wikipedia/commons/4/43/Flag_of_Northern_Ireland_%281953%E2%80%931972%29.svg',
	772: 'https://upload.wikimedia.org/wikipedia/commons/4/49/Flag_of_Ukraine.svg',
	773: 'https://upload.wikimedia.org/wikipedia/commons/e/e6/Flag_of_Slovakia.svg',
	774: 'https://upload.wikimedia.org/wikipedia/commons/7/73/Flag_of_Romania.svg',
	775: 'https://upload.wikimedia.org/wikipedia/commons/4/41/Flag_of_Austria.svg',
	776: 'https://upload.wikimedia.org/wikipedia/commons/4/45/Flag_of_Ireland.svg',
	777: 'https://upload.wikimedia.org/wikipedia/commons/b/b4/Flag_of_Turkey.svg',
	778: 'https://upload.wikimedia.org/wikipedia/commons/3/36/Flag_of_Albania.svg',
	1118: 'https://upload.wikimedia.org/wikipedia/commons/2/20/Flag_of_the_Netherlands.svg',
	1099: 'https://upload.wikimedia.org/wikipedia/commons/b/bc/Flag_of_Finland.svg',
	1108: 'https://upload.wikimedia.org/wikipedia/commons/1/10/Flag_of_Scotland.svg',
	1105: 'https://upload.wikimedia.org/wikipedia/commons/7/79/Flag_of_North_Macedonia.svg',
	2382: 'https://upload.wikimedia.org/wikipedia/commons/e/e8/Flag_of_Ecuador.svg',
	13: 'https://upload.wikimedia.org/wikipedia/commons/4/4f/Flag_of_Cameroon.svg',
	1569: 'https://upload.wikimedia.org/wikipedia/commons/6/65/Flag_of_Qatar.svg',
	22: 'https://upload.wikimedia.org/wikipedia/commons/c/ca/Flag_of_Iran.svg',
	2384: 'https://upload.wikimedia.org/wikipedia/en/a/a4/Flag_of_the_United_States.svg',
	26: 'https://upload.wikimedia.org/wikipedia/commons/1/1a/Flag_of_Argentina.svg',
	16: 'https://upload.wikimedia.org/wikipedia/commons/f/fc/Flag_of_Mexico.svg',
	23: 'https://upload.wikimedia.org/wikipedia/commons/0/0d/Flag_of_Saudi_Arabia.svg',
	28: 'https://upload.wikimedia.org/wikipedia/commons/c/ce/Flag_of_Tunisia.svg',
	20: 'https://upload.wikimedia.org/wikipedia/commons/8/88/Flag_of_Australia_%28converted%29.svg',
	29: 'https://upload.wikimedia.org/wikipedia/commons/f/f2/Flag_of_Costa_Rica.svg',
	12: 'https://upload.wikimedia.org/wikipedia/en/9/9e/Flag_of_Japan.svg',
	5529: 'https://upload.wikimedia.org/wikipedia/commons/d/d9/Flag_of_Canada_%28Pantone%29.svg',
	31: 'https://upload.wikimedia.org/wikipedia/commons/2/2c/Flag_of_Morocco.svg',
	14: 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Flag_of_Serbia.svg',
	6: 'https://upload.wikimedia.org/wikipedia/en/0/05/Flag_of_Brazil.svg',
	1530: 'https://upload.wikimedia.org/wikipedia/commons/4/4f/Flag_of_Cameroon.svg',
	7: 'https://upload.wikimedia.org/wikipedia/commons/f/fe/Flag_of_Uruguay.svg',
	1504: 'https://upload.wikimedia.org/wikipedia/commons/1/19/Flag_of_Ghana.svg',
	17: 'https://upload.wikimedia.org/wikipedia/commons/0/09/Flag_of_South_Korea.svg',
	1104: 'https://upload.wikimedia.org/wikipedia/commons/0/0f/Flag_of_Georgia.svg',
	1091: 'https://upload.wikimedia.org/wikipedia/commons/f/f0/Flag_of_Slovenia.svg',
};
