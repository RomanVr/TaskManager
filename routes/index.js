import welcom from './welcome';

const controllers = [welcom];

export default router => controllers.forEach(f => f(router));
