import models from '../models';
import buildFormObj from '../lib/formObjectBuilder';

export default (router) => {
  router // просмотр
    .get('users', '/users', async (ctx) => {
      // console.log('in GET /users');
      const users = await models.User.findAll();
      // console.log(`Users: ${JSON.stringify(users)}`);
      ctx.render('users', { users });
    })// форма создания
    .get('newUser', '/users/new', async (ctx) => {
      const user = models.User.build();
      ctx.render('users/new', { f: buildFormObj(user) });
    })// создание
    .post('users', '/users', async (ctx) => {
      const { request: { body: { form } } } = ctx;
      // console.log(`body data: ${JSON.stringify(form)}`);
      const user = models.User.build(form);
      // console.log(`user post: ${JSON.stringify(user)}`);
      try {
        await user.save();
        // flash
        ctx.flash.set('User has been created');
        ctx.redirect(router.url('root'));
      } catch (e) {
        // console.log(`error new User: ${JSON.stringify(_.groupBy(e.errors, 'path').email)}`);
        ctx.render('users/new', { f: buildFormObj(user, e) });
      }
    })// удаление
    .delete('deleteUser', '/users/:id', async (ctx) => {
      // console.log('Session userId: ', userIdsession);
      const userIdsession = ctx.session.userId;
      const { id: userId } = ctx.params;
      if (userIdsession.toString() !== userId) {
        ctx.flash.set("You can't do it!");
        ctx.redirect('/');
        return;
      }

      const user = await models.User.findOne({
        where: {
          id: userId,
        },
      });
      // console.log(`user for delete: ${JSON.stringify(user)}`);
      await models.User.destroy({
        where: {
          id: user.id,
        },
      });
      ctx.session = {};
      ctx.redirect(router.url('root'));
    })// форма редактирование
    .get('editUser', '/users/:id/edit', async (ctx) => {
      const { id: userId } = ctx.params;
      const user = await models.User.findOne({
        where: {
          id: userId,
        },
      });
      // console.log(`user for path: ${JSON.stringify(user)}`);
      ctx.render('users/edit', { f: buildFormObj(user) });
    })// редактирование
    .patch('editUserPatch', '/users/:id', async (ctx) => {
      const userIdsession = ctx.session.userId;
      // console.log('Session userId: ', userIdsession);
      const { id: userId } = ctx.params;
      if (userIdsession.toString() !== userId) {
        ctx.flash.set('You need to autenticate!');
        ctx.redirect(router.url('root'));
        return;
      }
      const { request: { body: { form } } } = ctx;
      const user = await models.User.findOne({
        where: {
          id: userId,
        },
      });
      // console.log('/////////////////////////');
      // console.log(`user for path: ${JSON.stringify(user)}`);
      // console.log('/////////////////////////');
      try {
        await user.update(form);
        // console.log('Update success!');
        ctx.flash.set('Has been updated');
        ctx.redirect(router.url('root'));
      } catch (e) {
        // console.log(e.message);
        ctx.render('users/edit', { f: buildFormObj(user, e) });
      }
    });
};
