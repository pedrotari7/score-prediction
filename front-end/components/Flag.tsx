import { Team } from '../../interfaces/main';
import { classNames } from '../lib/utils/reactHelper';

const Flag = ({ className = '', team }: { team: Team; className?: string }) => {
	if (!(team?.id in FLAGS)) console.log(`team`, team);
	return (
		<div className={classNames(className, 'flex justify-center items-center')}>
			<img className="h-5 w-7 mx-2" src={FLAGS[team?.id]} />
		</div>
	);
};

export default Flag;

const FLAGS: Record<number | string, string> = {
	'777': 'https://upload.wikimedia.org/wikipedia/commons/b/b4/Flag_of_Turkey.svg',
	'1118': 'https://upload.wikimedia.org/wikipedia/commons/2/20/Flag_of_the_Netherlands.svg',
	'773': 'https://upload.wikimedia.org/wikipedia/commons/e/e6/Flag_of_Slovakia.svg',
	'4': 'https://upload.wikimedia.org/wikipedia/en/f/f3/Flag_of_Russia.svg',
	'3': 'https://upload.wikimedia.org/wikipedia/commons/1/1b/Flag_of_Croatia.svg',
	'27': 'https://upload.wikimedia.org/wikipedia/commons/5/5c/Flag_of_Portugal.svg',
	'770': 'https://upload.wikimedia.org/wikipedia/commons/c/cb/Flag_of_the_Czech_Republic.svg',
	'1': 'https://upload.wikimedia.org/wikipedia/commons/9/92/Flag_of_Belgium_%28civil%29.svg',
	'767': 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Flag_of_Wales_%281959%E2%80%93present%29.svg',
	'1099': 'https://upload.wikimedia.org/wikipedia/commons/b/bc/Flag_of_Finland.svg',
	'2': 'https://upload.wikimedia.org/wikipedia/en/c/c3/Flag_of_France.svg',
	'772': 'https://upload.wikimedia.org/wikipedia/commons/4/49/Flag_of_Ukraine.svg',
	'21': 'https://upload.wikimedia.org/wikipedia/commons/9/9c/Flag_of_Denmark.svg',
	'15': 'https://upload.wikimedia.org/wikipedia/commons/f/f3/Flag_of_Switzerland.svg',
	'1108': 'https://upload.wikimedia.org/wikipedia/commons/1/10/Flag_of_Scotland.svg',
	'775': 'https://upload.wikimedia.org/wikipedia/commons/4/41/Flag_of_Austria.svg',
	'10': 'https://upload.wikimedia.org/wikipedia/en/b/be/Flag_of_England.svg',
	'769': 'https://upload.wikimedia.org/wikipedia/commons/c/c1/Flag_of_Hungary.svg',
	'24': 'https://upload.wikimedia.org/wikipedia/en/1/12/Flag_of_Poland.svg',
	'768': 'https://upload.wikimedia.org/wikipedia/en/0/03/Flag_of_Italy.svg',
	'25': 'https://upload.wikimedia.org/wikipedia/en/b/ba/Flag_of_Germany.svg',
	'1105': 'https://upload.wikimedia.org/wikipedia/commons/7/79/Flag_of_North_Macedonia.svg',
	'9': 'https://upload.wikimedia.org/wikipedia/en/9/9a/Flag_of_Spain.svg',
	'5': 'https://upload.wikimedia.org/wikipedia/en/4/4c/Flag_of_Sweden.svg',
};
