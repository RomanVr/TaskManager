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
      const { Op } = models.Sequelize;
      console.log('in Get /tasks');
      console.log('Query params: ', ctx.query, ' type: ', typeof ctx.query, ' keys: ', Object.keys(ctx.query).length);
      let tasks;
      if (Object.keys(ctx.query).length !== 0) {
        const {
          name, tags, status, assignedTo,
        } = ctx.query;
        console.log('name: ', name, ' tags: ', tags, ' status: ', ' assignedTo: ', assignedTo);

        tasks = await models.Task.findAll(
          {
            where: { name: 'New task' },
            include: [
              { model: models.User, as: 'assigned' },
              { model: models.Tag, as: 'tags' },
              { model: models.TaskStatus, as: 'status' },
              { model: models.User, as: 'creator' },
            ],
          },
        );
      } else {
        tasks = await models.Task.findAll({ include: ['assigned', 'tags', 'status', 'creator'] });
      }
      // console.log('tasks: ', tasks);
      ctx.render('tasks', { tasks });
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
      const users = await models.User.findAll();
      ctx.render('tasks/new', { f: buildFormObj(task), data: { users } });
    }) // форма просмотра задачи
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
    }) // создание новой задачи
    .post('tasks', '/tasks', async (ctx) => {
      const userIdsession = ctx.session.userId;
      if (!userIdsession) {
        ctx.flash.set('You need to autenticate!');
        ctx.redirect('/');
        return;
      }
      const { request: { body: { form } } } = ctx;
      console.log(`form data: ${JSON.stringify(form)}`);
      // console.log('body data: ', JSON.stringify(ctx.request.body));

      console.log('tagsForm: ', form.tags);
      const regComma = /\s*,\s*/;
      const tagsName = form.tags.split(regComma);
      console.log('tagsName: ', tagsName);
      const task = models.Task.build(form);

      const userCreator = await models.User.findOne({ where: { id: userIdsession } });
      try {
        task.setCreator(userCreator);
        console.log('Task build: ', JSON.stringify(task));
      } catch (e) {
        console.log('Set creator error: ', e);
      }

      const userAssigned = await models.User.findOne({ where: { id: form.assigned } });
      task.setAssigned(userAssigned);

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
      const userIdsession = ctx.session.userId;
      if (!userIdsession) {
        ctx.flash.set('You need to autenticate!');
        ctx.redirect('/');
        return;
      }
      console.log('In edit Task');
      const { id: taskId } = ctx.params;

      const task = await models.Task.findOne({
        where: { id: taskId },
        include: ['tags', 'assigned', 'status', 'creator'],
      });
      // console.log(task.get({ plain: true }));

      const users = await models.User.findAll();
      const statuses = await models.TaskStatus.findAll();
      ctx.render('tasks/edit', { f: buildFormObj(task), data: { users, statuses } });
    }) // редактирование задачи
    .patch('editTaskPatch', '/tasks/:id', async (ctx) => {
      const userIdsession = ctx.session.userId;
      if (!userIdsession) {
        ctx.flash.set('You need to autenticate!');
        ctx.redirect('/');
        return;
      }
      const { request: { body: { form } } } = ctx;
      console.log(`form data: ${JSON.stringify(form)}`);
      const { id: taskId } = ctx.params;
      const task = await models.Task.findOne({
        where: { id: taskId },
      });
      console.log(task.get({ plain: true }));
      await task.update(form);
      ctx.redirect(`/tasks/${taskId}`);
    }) // удаление задачи
    .delete('deleteTask', '/tasks/:id', async (ctx) => {
      const userIdsession = ctx.session.userId;
      // console.log('Session userId: ', userIdsession);
      const { id: taskId } = ctx.params;

      const task = await models.Task.findOne({
        where: { id: taskId },
        include: ['creator'],
      });

      // console.log('Creator id: ', task.creator.id, ' type: ', typeof task.creator.id);
      if (!userIdsession || userIdsession.toString() !== task.creator.id.toString()) {
        ctx.flash.set('You are not autorized to remove this task!');
        ctx.redirect(router.url('tasks'));
        return;
      }
      try {
        await models.Task.destroy({
          where: {
            id: task.id,
          },
        });
      } catch (e) {
        console.log(e);
      }

      ctx.redirect(router.url('tasks'));
    });
};
