import models from '../models';

export default (router) => {
  router
    .get('users', '/users', async (ctx) => {
      console.log('in GET /users');
      const users = await models.User.findAll();
      console.log(`Users: ${JSON.stringify(users)}`);
      ctx.render('users/index', { users });
    })
    .get('newUser', '/users/new', async (ctx) => {
      const user = models.User.build();
      ctx.render('users/new', { f: user });
    })
    .post('users', '/users', async (ctx) => {
      const { request: { body: form } } = ctx;
      const user = models.User.build(form);
      try {
        await user.save();
        // flash
        ctx.redirect(router.url('root'));
      } catch (e) {
        ctx.render('users/new', { f: { ...user, e } });
      }
    });
};
