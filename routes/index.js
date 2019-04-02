import welcom from './welcome';
import users from './users';
import sessions from './sessions';

const controllers = [welcom, users, sessions];

export default router => controllers.forEach(f => f(router));
