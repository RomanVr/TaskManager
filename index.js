import path from 'path';
import Koa from 'koa';
import KoaRouter from 'koa-router';
import Pug from 'koa-pug';
import koalogger from 'koa-logger';
import bodyParser from 'koa-bodyparser';
import methodOverride from 'koa-methodoverride';
import serve from 'koa-static';
import session from 'koa-generic-session';
import flash from 'koa-flash-simple';
import Rollbar from 'rollbar';
import 'dotenv'; // run file
import _ from 'lodash';

import { logApp } from './lib/logger';
import addRoutes from './routes';

export default () => {
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
    logApp(`req.body: ${JSON.stringify(req.body)}`);
    if (req.body && typeof req.body === 'object' && '_method' in req.body) {
      return req.body._method;// eslint-disable-line
    }
    return null;
  }));
  app.use(serve(path.join(__dirname, 'public')));

  app.use(async (ctx, next) => {
    logApp('IN ROUTE constraint check');
    logApp('method: ', ctx.request.method, ' URL: ', ctx.request.url, ' User Id: ', ctx.session.userId);
    logApp('session: ', JSON.stringify(ctx.session));
    logApp('state: ', JSON.stringify(ctx.state));
    const { url } = ctx.request;

    const urlAccessFree = new Set(['/', '/session', '/session/new', '/users', '/users/new']);

    if (urlAccessFree.has(url)) {
      logApp('Free access');
      await next();
      return;
    }

    if (ctx.session.userId === undefined) {
      logApp('Access failed!!!');
      ctx.flash.set({ danger: 'You need to autenticate!' });
      ctx.redirect('/');
      return;
    }

    logApp('Access confirmed');
    await next();
  });

  app.use(koalogger());
  const router = new KoaRouter();
  addRoutes(router);
  app.use(router.routes());

  app.use((ctx) => {
    ctx.response.status = 404;
    ctx.render('404');
  });

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
