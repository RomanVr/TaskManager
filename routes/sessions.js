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
      const { request: { body: { form } } } = ctx;
      logRoute('form data: ', form);
      const user = await models.User.findOne({
        where: {
          email: form.email,
        },
      });

      if (user && user.passwordDigest === encrypt(form.password)) {
        logRoute('User to register:\n', user.get({ plain: true }));
        logRoute('Registration successfull!');
        ctx.session.userId = user.id;
        ctx.session.userFullName = user.fullName;
        // ctx.render('welcome/index');
        ctx.redirect(router.url('root'));
        return;
      }
      logRoute('Registration fail!');
      ctx.flash.set({ message: 'Email or password were wrong', div: 'alert-danger' });
      ctx.session.userEmail = form.email;
      ctx.redirect(router.url('newSession'));
    })
    .delete('session', '/session', (ctx) => {
      logRoute('In DELETE session!');
      ctx.session = {};
      ctx.redirect(router.url('root'));
    });
};
