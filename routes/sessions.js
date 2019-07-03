import buildFormObj from '../lib/formObjectBuilder';
import { encrypt } from '../lib/secure';
import models from '../models';
import { logRoute } from '../lib/logger';

export default (router) => {
  router
    .get('newSession', '/session/new', async (ctx) => {
      const data = { email: ctx.session.userEmail };
      ctx.render('sessions/new', { f: buildFormObj(data) });
    })
    .post('session', '/session', async (ctx) => {
      const { request: { body: { form } } } = ctx;
      const user = await models.User.findOne({
        where: {
          email: form.email,
        },
      });

      if (user && user.passwordDigest === encrypt(form.password)) {
        logRoute('Registration successfull!');
        ctx.session.userId = user.id;
        ctx.session.userFullName = user.fullName;
        ctx.redirect(router.url('root'));
        return;
      }
      logRoute('Registration fail!');
      ctx.flash.set({ danger: 'Email or password were wrong' });
      ctx.session.userEmail = form.email;
      ctx.redirect(router.url('newSession'));
    })
    .delete('session', '/session', (ctx) => {
      ctx.session = {};
      ctx.redirect(router.url('root'));
    });
};
