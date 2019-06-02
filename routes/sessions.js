import buildFormObj from '../lib/formObjectBuilder';
import { encrypt } from '../lib/secure';
import models from '../models';
import { logRoute } from '../lib/logger';

export default (router) => {
  router
    .get('newSession', '/session/new', async (ctx) => {
      logRoute('In GET session!');
      const data = { email: ctx.session.userEmail };
      ctx.render('sessions/new', { f: buildFormObj(data) });
    })
    .post('session', '/session', async (ctx) => {
      logRoute('In POST session!');
      const { email, password } = ctx.request.body.form;
      const user = await models.User.findOne({
        where: {
          email,
        },
      });
      logRoute('User to register:\n', user.get({ plain: true }));
      if (user && user.passwordDigest === encrypt(password)) {
        logRoute('Registration successful!');
        ctx.session.userId = user.id;
        ctx.session.userFullName = user.fullName;
        ctx.redirect(router.url('root'));
        return;
      }
      logRoute('Registration fail!');
      ctx.flash.set('email or password were wrong');
      ctx.session.userEmail = email;
      ctx.redirect(router.url('newSession'));
    })
    .delete('session', '/session', (ctx) => {
      logRoute('In DELETE session!');
      ctx.session = {};
      ctx.redirect(router.url('root'));
    });
};
