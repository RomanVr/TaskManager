import _ from 'lodash';
import models from '../models';
import buildFormObj from '../lib/formObjectBuilder';
import { logRoute } from '../lib/logger';

export default (router) => {
  router // просмотр
    .get('users', '/users', async (ctx) => {
      logRoute('In GET /users');
      const users = await models.User.findAll();
      ctx.render('users', { users });
    })// форма создания
    .get('newUser', '/users/new', async (ctx) => {
      logRoute('In GET /users/new');
      const user = models.User.build();
      ctx.render('users/new', { f: buildFormObj(user) });
    })// создание
    .post('usersPost', '/users', async (ctx) => {
      logRoute('In POST /users');
      const { request: { body: { form } } } = ctx;
      logRoute(`body data: ${JSON.stringify(form)}`);
      const user = models.User.build(form);
      try {
        await user.save();
        ctx.flash.set('User has been created');
        ctx.redirect(router.url('root'));
      } catch (e) {
        logRoute('Errors: ', _.groupBy(e.errors, 'path'));
        logRoute('Create user with Error!!!, ', e.message);
        ctx.render('users/new', { f: buildFormObj(user, e) });
      }
    })// удаление
    .delete('deleteUser', '/users/:id', async (ctx) => {
      logRoute('In DELETE /user');
      const userIdsession = ctx.session.userId;
      const { id: userId } = ctx.params;
      logRoute('User id: ', userId);
      if (userIdsession.toString() !== userId) {
        ctx.flash.set("You can't do it!");
        ctx.redirect(router.url('root'));
        return;
      }
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
        ctx.flash.set('User has been deleted!');
        ctx.redirect(router.url('root'));
      } catch (e) {
        logRoute('Error deleted user!!!: ', e);
        ctx.flash.set("You can't do it!");
        ctx.redirect(router.url('root'));
      }
    })// форма редактирование
    .get('editUser', '/users/:id/edit', async (ctx, next) => {
      logRoute('In GET editUser');
      const { id: userId } = ctx.params;
      logRoute('User id: ', userId);
      const user = await models.User.findOne({
        where: {
          id: userId,
        },
      });
      if (!user) {
        next();
        return;
      }
      ctx.render('users/edit', { f: buildFormObj(user) });
    })// редактирование
    .patch('editUserPatch', '/users/:id', async (ctx) => {
      logRoute('In PATCH user');
      const userIdsession = ctx.session.userId;
      const { id: userId } = ctx.params;
      logRoute('User id: ', userId);
      if (userIdsession.toString() !== userId) {
        ctx.flash.set("You can't do it!");
        ctx.redirect(router.url('root'));
        return;
      }
      const { request: { body: { form } } } = ctx;
      logRoute('Data body: ', JSON.stringify(form));
      const user = await models.User.findOne({
        where: {
          id: userId,
        },
      });
      try {
        await user.update(form);
        ctx.flash.set('Has been updated');
        ctx.redirect(router.url('root'));
      } catch (e) {
        logRoute('Update user with Error!!!');
        ctx.render('users/edit', { f: buildFormObj(user, e) });
      }
    });
};
