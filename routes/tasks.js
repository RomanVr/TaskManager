import models from '../models';
import buildFormObj from '../lib/formObjectBuilder';

export default (router) => {
  router // список задач
    .get('tasks', '/tasks', async (ctx) => {
      const userIdsession = ctx.session.userId;
      if (!userIdsession) {
        ctx.flash.set('You need to autenticate!');
        ctx.redirect('/');
        return;
      }

      console.log('in Get /tasks');
      const tasks = await models.Task.findAll({ include: ['status', 'creator', 'tags'] });

      ctx.render('tasks', { tasks });
    })
    .get('task', '/tasks/:id', async (ctx) => {
      console.log('In Task');
      const { id: taskId } = ctx.params;
      let task;
      try {
        task = await models.Task.findOne({
          where: { id: taskId },
          include: ['creator', 'tags', 'assigned', 'status'],
        });
        console.log(task.get({ plain: true }));
      } catch (e) {
        console.log('Error task findOne: ', e);
      }
      ctx.render('tasks/task', { f: buildFormObj(task) });
    }) // форма для создания новой задачи
    .get('newTask', '/tasks/new', async (ctx) => {
      console.log('In newTask');
      const userIdsession = ctx.session.userId;
      if (!userIdsession) {
        ctx.flash.set('You need to autenticate!');
        ctx.redirect('/');
        return;
      }
      const task = models.Task.build();
      ctx.render('tasks/new', { f: buildFormObj(task) });
    }) // создание новой задачи
    .post('tasks', '/tasks', async (ctx) => {
      const userIdsession = ctx.session.userId;
      if (!userIdsession) {
        ctx.flash.set('You need to autenticate!');
        ctx.redirect('/');
        return;
      }
      const { request: { body: { form } } } = ctx;
      console.log(`body data: ${JSON.stringify(form)}`);

      console.log('tagsForm: ', form.tags);
      const regComma = /\s*,\s*/;
      const tagsName = form.tags.split(regComma);
      console.log('tagsName: ', tagsName);
      const task = models.Task.build(form);

      const user = await models.User.findOne({ where: { id: userIdsession } });
      try {
        task.setCreator(user);
        console.log('Task build: ', JSON.stringify(task));
      } catch (e) {
        console.log('Set creator error: ', e);
      }

      const [statusNew, created] = await models.TaskStatus.findOrCreate({ where: { name: 'New' } });
      console.log('Satus new created: ', created);
      try {
        task.setStatus(statusNew);
      } catch (e) {
        console.log('Set status error: ', e);
      }
      try {
        await task.save();

        const tagsPromises = tagsName.map(async (nameTag) => {
          let tag = await models.Tag.findOne({ where: { name: nameTag } });
          if (tag === null) {
            tag = await models.Tag.create({ name: nameTag });
          }
          return tag;
        });

        // const [tagOne] = await models.Tag.findOrCreate({ where: { name: 'simple' } });
        // const tags = [tagOne];
        // -- version 1 error: SQLITE_BUSY: data base is locked
        // const tagsPromises = tagsName.map(async (nameTag) => {
        //   const [tag, createdTag] = await models.Tag.findOrCreate({ where: { name: nameTag } });
        //   console.log('tag created: ', createdTag, ' name', nameTag);
        //   await task.addTags([tag]);
        // });
        const tags = await Promise.all(tagsPromises);

        console.log('tags: ', tags);

        await task.addTags(tags);

        // const [tag, createdTag]
        //    = await models.Tag.findOrCreate({ where: { name: tagsName[0] } });
        // console.log('tag created: ', createdTag, ' name', tagsName[0]);
        // await task.addTags([tag]);

        console.log('task save: ', task.get({ include: ['status', 'creator', 'tags'] }));
        ctx.flash.set('Task has been created');
        ctx.redirect(router.url('tasks'));
      } catch (e) {
        console.log('Error new Task: ', e);
        ctx.render('tasks/new', { f: buildFormObj(task, e) });
      }
    }) // форма редактирования задачи
    .get('editTask', '/tasks/:id/edit', async (ctx) => {
      console.log('In edit Task');
      const { id: taskId } = ctx.params;
      let task;
      try {
        task = await models.Task.findOne({
          where: { id: taskId },
          include: ['creator', 'tags', 'assigned', 'status'],
        });
        console.log(task.get({ plain: true }));
      } catch (e) {
        console.log('Error tast findOne: ', e);
      }
      ctx.render('tasks/edit', { f: buildFormObj(task.get({ plain: true })) });
    }) // редактирование задачи
    .patch('editTaskPatch', '/tasks/:id', async (ctx) => {

    }) // удаление задачи
    .delete('deleteTask', '/tasks/:id', async (ctx) => {
      // console.log('Session userId: ', userIdsession);
      // const userIdsession = ctx.session.userId;
      const { id: taskId } = ctx.params;
      // if (!userIdsession || userIdsession.toString() !== userId) {
      //   ctx.flash.set('You need to autenticate!');
      //   ctx.redirect('/');
      //   return;
      // }

      const task = await models.Task.findOne({
        where: {
          id: taskId,
        },
      });

      await models.Task.destroy({
        where: {
          id: task.id,
        },
      });

      ctx.redirect(router.url('tasks'));
    });
};
