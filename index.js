import path from 'path';
import Koa from 'koa';
import KoaRouter from 'koa-router';
import Pug from 'koa-pug';
import bodyParser from 'koa-bodyparser';
import serve from 'koa-static';
import Rollbar from 'rollbar';

import addRoutes from './routes';

export default () => {
  const app = new Koa();
  const router = new KoaRouter();

  const rollbar = new Rollbar('POST_SERVER_ITEM_ACCESS_TOKEN');
  app.use(async (ctx, next) => {
    try {
      await next();
    } catch (err) {
      rollbar.error(err, ctx.request);
    }
  });

  app.use(bodyParser());
  app.use(serve(path.join(__dirname, 'public')));

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
