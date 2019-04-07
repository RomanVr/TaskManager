import buildFormObj from '../lib/formObjectBuilder';
import { encrypt } from '../lib/secure';
import models from '../models';

export default (router) => {
  router
    .get('newSession', '/session/new', async (ctx) => {
      const data = {};
      ctx.render('sessions/new', { f: buildFormObj(data) });
    })
    .post('session', '/session', async (ctx) => {
      console.log('In post session');
      const { email, password } = ctx.request.body.form;
      const user = await models.User.findOne({
        where: {
          email,
        },
      });
      console.log(`Register user: ${JSON.stringify(user)}`);
      if (user && user.passwordDigest === encrypt(password)) {
        console.log('Register success!');
        ctx.session.userId = user.id;
        ctx.session.userFullName = user.fullName;
        ctx.redirect(router.url('root'));
        return;
      }
      console.log('Register fail!!!');
      // flash
      console.log('flash: ', ctx.flash);
      ctx.flash.set('email or password were wrong');
      ctx.render('sessions/new', { f: buildFormObj({ email }) });
    })
    .delete('session', '/session', (ctx) => {
      ctx.session = {};
      ctx.redirect(router.url('root'));
    });
};
