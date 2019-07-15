import _ from 'lodash';
import models from '../models';
import buildFormObj from '../lib/formObjectBuilder';
import { logRoute } from '../lib/logger';

const requireAuth = async (ctx, next) => {
  logRoute('Path for routing Users: ', ctx.request.url);
  if (ctx.params.id === ctx.state.userId.toString()) {
    await next();
    return;
  }
  ctx.flash.set({ danger: "You can't do it!" });
  ctx.redirect('/');
};

export default (router) => {
  router // просмотр
    .get('users', '/users', async (ctx) => {
      const users = await models.User.findAll();
      ctx.render('users', { users });
    })// форма создания
    .get('newUser', '/users/new', async (ctx) => {
      const user = models.User.build();
      ctx.render('users/new', { f: buildFormObj(user) });
    })// создание
    .post('usersPost', '/users', async (ctx) => {
      const { request: { body: { form } } } = ctx;
      const user = models.User.build(form);
      try {
        await user.save();
        ctx.flash.set({ info: 'User has been created' });
        ctx.redirect(router.url('root'));
      } catch (e) {
        logRoute('Errors: ', _.groupBy(e.errors, 'path'));
        logRoute('Create user with Error!!!, ', e.message);
        ctx.render('users/new', { f: buildFormObj(user, e) });
      }
    })// удаление
    .delete('deleteUser', '/users/:id', requireAuth, async (ctx) => {
      const { id: userId } = ctx.params;
      try {
        const user = await models.User.findOne({
          where: {
            id: userId,
          },
        });
        await models.User.destroy({
          where: {
            id: user.id,
          },
        });
        logRoute('User delete!');
        ctx.session = {};
        ctx.flash.set({ info: 'User has been deleted!' });
        ctx.redirect(router.url('root'));
      } catch (e) {
        logRoute('Error deleted user!!!: ', e);
        ctx.flash.set({ danger: `You can't do it!\n${e.message}` });
        ctx.redirect(router.url('root'));
      }
    })// форма редактирование
    .get('editUser', '/users/:id/edit', requireAuth, async (ctx) => {
      const { id: userId } = ctx.params;
      const user = await models.User.findOne({
        where: {
          id: userId,
        },
      });
      ctx.render('users/edit', { f: buildFormObj(user) });
    })// редактирование
    .patch('editUserPatch', '/users/:id', requireAuth, async (ctx) => {
      const { id: userId } = ctx.params;
      const { request: { body: { form } } } = ctx;
      const user = await models.User.findOne({
        where: {
          id: userId,
        },
      });
      try {
        await user.update(form);
        ctx.flash.set({ info: 'Has been updated' });
        ctx.redirect(router.url('root'));
      } catch (e) {
        ctx.render('users/edit', { f: buildFormObj(user, e) });
      }
    });
};
