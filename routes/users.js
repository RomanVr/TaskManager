import _ from 'lodash';
import models from '../models';
import buildFormObj from '../lib/formObjectBuilder';

export default (router) => {
  router // просмотр
    .get('users', '/users', async (ctx) => {
      console.log('in GET /users');
      const users = await models.User.findAll();
      console.log(`Users: ${JSON.stringify(users)}`);
      ctx.render('users/index', { users });
    })// форма создания
    .get('newUser', '/users/new', async (ctx) => {
      const user = models.User.build();
      ctx.render('users/new', { f: buildFormObj(user) });
    })// обработка при создании
    .post('users', '/users', async (ctx) => {
      const { request: { body: { form } } } = ctx;
      console.log(`body data: ${JSON.stringify(form)}`);
      const user = models.User.build(form);
      console.log(`user post: ${JSON.stringify(user)}`);
      try {
        await user.save();
        // flash
        ctx.redirect(router.url('root'));
      } catch (e) {
        console.log(`error new User: ${JSON.stringify(_.groupBy(e.errors, 'path').email)}`);
        ctx.render('users/new', { f: buildFormObj(user, e) });
      }
    })// удаление
    .delete('deleteUser', '/users/:id', async (ctx) => {
      const { id: userId } = ctx.params;
      const user = await models.User.findOne({
        where: {
          id: userId,
        },
      });
      console.log(`user for delete: ${JSON.stringify(user)}`);
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
      console.log(`user for path: ${JSON.stringify(user)}`);
      ctx.render('users/edit', { f: buildFormObj(user) });
    })// редактирование
    .patch('editUserPatch', '/users/:id', async (ctx) => {
      const { id: userId } = ctx.params;
      const userUpdated = await models.User.findOne({
        where: {
          id: userId,
        },
      })
        .then((user) => {
          user.update();
        });
      console.log(`user for path: ${JSON.stringify(userUpdated)}`);
      ctx.redirect(router.url('root'));
    });
};
