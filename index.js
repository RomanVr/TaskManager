import path from 'path';
import Koa from 'koa';
import KoaRouter from 'koa-router';
import Pug from 'koa-pug';
import bodyParser from 'koa-bodyparser';
import methodOverride from 'koa-methodoverride';
import serve from 'koa-static';
import session from 'koa-generic-session';
import flash from 'koa-flash-simple';
import Rollbar from 'rollbar';
import dotenv from 'dotenv';
import _ from 'lodash';

import addRoutes from './routes';

export default () => {
  dotenv.config();

  const app = new Koa();

  const rollbar = new Rollbar({
    accessToken: 'POST_SERVER_ITEM_ACCESS_TOKEN',
    captureUncaught: true,
    captureUnhandledRejections: true,
  });
  app.use(async (ctx, next) => {
    try {
      await next();
    } catch (err) {
      rollbar.error(err, ctx.request);
    }
  });

  app.keys = ['secret keys'];
  app.use(session(app));
  app.use(flash());
  app.use(async (ctx, next) => {
    // console.log('flash get:', ctx.flash.get());
    // const { url, method } = ctx.request;
    // console.log('request url: ', method, url);
    ctx.state = {
      flash: ctx.flash,
      isSignedIn: () => ctx.session.userId !== undefined,
      userId: ctx.session.userId,
      userFullName: ctx.session.userFullName,
    };
    await next();
  });

  app.use(bodyParser());
  app.use(methodOverride((req) => {
    console.log(`req.body: ${JSON.stringify(req.body)}`);
    if (req.body && typeof req.body === 'object' && '_method' in req.body) {
      return req.body._method;// eslint-disable-line
    }
    return null;
  }));
  app.use(serve(path.join(__dirname, 'public')));

  const router = new KoaRouter();
  addRoutes(router);
  app.use(router.routes());

  const pug = new Pug({
    viewPath: path.join(__dirname, 'views'),
    basedir: path.join(__dirname, 'views'),
    noCache: process.env.NODE_ENV === 'development',
    debug: true,
    pretty: true,
    compileDebug: true,
    helperPath: [
      { _ },
      { urlForRouter: (...args) => router.url(...args) },
    ],
  });
  pug.use(app);

  return app;
};
