import db from '../models';

export default (router) => {
  router
    .get('users', '/users', async (ctx) => {
      const users = await db.User.findAll();
      ctx.render('users', { users });
    })
    .get('newUser', '/users/new', async (ctx) => {
      const user = db.User.build();
      ctx.render('user/new', { f: user });
    })
    .post('users', '/users', async (ctx) => {
      const { request: { body: form } } = ctx;
      const user = db.User.build(form);
      try {
        await user.save();
        // flash
        ctx.redirect(router.url('root'));
      } catch (e) {
        ctx.render('users/new', { f: { ...user, e } });
      }
    });
};
