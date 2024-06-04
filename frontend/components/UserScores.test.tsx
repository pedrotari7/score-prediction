import { User } from '../../interfaces/main';
import { customRender } from '../lib/utils/testUtils';
import { Circle, UserScores } from './UserScores';

jest.mock('react-tooltip');

describe('UserScores', () => {
	it('renders user scores', () => {
		const { container } = customRender(
			<UserScores
				user={
					{
						score: {
							exact: 1,
							onescore: 2,
							points: 3,
							result: 4,
							penalty: 5,
							fail: 6,
							groups: 7,
						},
					} as Partial<User> as User
				}
			/>
		);
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
