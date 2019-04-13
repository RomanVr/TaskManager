import models from '../models';

export default (router) => {
  router
    .get('tasks', '/tasks', async (ctx) => {
      const userIdsession = ctx.session.userId;
      if (!userIdsession) {
        ctx.flash.set('You need to autenticate!');
        ctx.redirect('/');
        return;
      }

      console.log('in Get /tasks');
      let tasks;
      try {
        tasks = await models.Task.findAll();
      } catch (e) {
        tasks = [];
      }
      ctx.render('tasks', { tasks });
    });
};
