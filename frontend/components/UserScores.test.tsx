import type { User } from '../../interfaces/main';
import { customRender } from '../lib/utils/testUtils';
import { Circle, UserScores } from './UserScores';

jest.mock('react-tooltip');

describe('UserScores', () => {
	const user = {
		score: {
			all: {
				exact: 1,
				onescore: 2,
				points: 3,
				result: 4,
				penalty: 5,
				fail: 6,
				groups: 7,
			},
			Groups: {
				exact: 8,
				onescore: 9,
				points: 10,
				result: 11,
				penalty: 12,
				fail: 13,
				groups: 14,
			},
		},
	} as Partial<User> as User;

	it('renders user scores with a stage all', () => {
		const { container } = customRender(<UserScores user={user} stage='all' />);
		expect(container).toMatchSnapshot();
	});

	it('renders user scores with a stage groups', () => {
		const { container } = customRender(<UserScores user={user} stage='Groups' />);
		expect(container).toMatchSnapshot();
	});
});

describe('Circle', () => {
	it('renders circle with children ', () => {
		const { container } = customRender(
			<Circle className='test'>
				<div>test children</div>
			</Circle>
		);
		expect(container).toMatchSnapshot();
	});
});
