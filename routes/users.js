import db from '../models';

export default (router) => {
  router
    .get('users', '/users', async (ctx) => {
      console.log('in GET /users');
      try {
        const users = await db.User.findAll();
        console.log(`Users: ${JSON.stringify(users)}`);
        ctx.render('users/index', { users });
      } catch (e) {
        console.log(e);
        ctx.render('users/index');
      }
    });
  /*
    .get('newUser', '/users/new', async (ctx) => {
      const user = db.User.build();
      ctx.render('users/new', { f: user });
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
    */
};
