import welcom from './welcome';
import users from './users';
import sessions from './sessions';
import tasks from './tasks';
import tags from './tags';

const controllers = [welcom, users, sessions, tasks, tags];

export default router => controllers.forEach(f => f(router));
