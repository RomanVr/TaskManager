import welcom from './welcome';
import users from './users';

const controllers = [welcom, users];

export default router => controllers.forEach(f => f(router));
