import path from 'path';
import Koa from 'koa';
import KoaRouter from 'koa-router';
import Pug from 'koa-pug';
import bodyParser from 'koa-bodyparser';

import addRoutes from './routes';

export default () => {
  const app = new Koa();
  const router = new KoaRouter();

  app.use(bodyParser());

  addRoutes(router);
  app.use(router.routes());
  const pug = new Pug({
    viewPath: path.join(__dirname, 'views'),
    basedir: path.join(__dirname, 'views'),
    noCache: process.env.NODE_ENV === 'development',
    debug: true,
    pretty: true,
  });
  pug.use(app);

  return app;
};
