import welcome from './welcome';
import users from './users';
import sessions from './sessions';
import tasks from './tasks';
import tags from './tags';
import statuses from './statuses';

const controllers = [welcome, users, sessions, tasks, tags, statuses];

export default router => controllers.forEach(f => f(router));
