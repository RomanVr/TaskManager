import _ from 'lodash';
import models from '../models';
import buildFormObj from '../lib/formObjectBuilder';
import { logRoute } from '../lib/logger';

export default (router) => {
  router // список задач
    .get('tasks', '/tasks', async (ctx) => {
      const { Op } = models.Sequelize;
      if (_.isEmpty(ctx.query)) {
        logRoute('No filters');
        const tasks = await models.Task.findAll({ include: ['assigned', 'tags', 'status', 'creator'] });
        ctx.render('tasks', { tasks });
        return;
      }

      if (!_.isEmpty(ctx.query.meTask)) {
        logRoute('Me tasks filter');
        const userIdsession = ctx.session.userId;
        const tasks = await models.Task.findAll(
          {
            include: [
              { model: models.User, as: 'assigned' },
              { model: models.Tag, as: 'tags' },
              { model: models.TaskStatus, as: 'status' },
              { model: models.User, as: 'creator', where: { id: userIdsession } },
            ],
          },
        );
        ctx.render('tasks', { tasks });
        return;
      }

      const {
        nameTask, tagName, statusName, assignedName,
      } = ctx.query;

      const tasks = await models.Task.findAll(
        {
          where: { name: { [Op.substring]: nameTask } },
          include: [
            {
              model: models.User,
              as: 'assigned',
              where: {
                [Op.or]: [
                  { firstName: { [Op.substring]: assignedName } },
                  { lastName: { [Op.substring]: assignedName } },
                ],
              },
            },
            { model: models.Tag, as: 'tags', where: { name: { [Op.substring]: tagName } } },
            { model: models.TaskStatus, as: 'status', where: { name: { [Op.substring]: statusName } } },
            { model: models.User, as: 'creator' },
          ],
        },
      );
      ctx.render('tasks', { tasks });
    }) // форма для создания новой задачи
    .get('newTask', '/tasks/new', async (ctx) => {
      const task = models.Task.build();
      const users = await models.User.findAll();
      ctx.render('tasks/new', { f: buildFormObj(task), data: { users } });
    }) // форма просмотра задачи
    .get('task', '/tasks/:id', async (ctx, next) => {
      const { id: taskId } = ctx.params;
      const task = await models.Task.findOne({
        where: { id: taskId },
        include: ['creator', 'tags', 'assigned', 'status'],
      });
      if (task) {
        ctx.render('tasks/task', { f: buildFormObj(task) });
        return;
      }
      next();
    }) // создание новой задачи
    .post('tasksPost', '/tasks', async (ctx) => {
      const { request: { body: { form } } } = ctx;
      form.creatorId = ctx.session.userId;
      // !!!! logRoute(`form data: ${JSON.stringify(form)}`); !!!!!
      const regComma = /\s*,\s*/;
      const tagsName = form.tags ? form.tags.split(regComma) : [];
      const formProperty = _.pickBy(form, value => value !== '');
      const task = models.Task.build(formProperty);

      const [statusNew] = await models.TaskStatus.findOrCreate({ where: { name: 'New' } });
      task.setStatus(statusNew);
      try {
        await task.save();

        // version is work!!!
        const tagsPromises = tagsName.map(async (nameTag) => {
          let tag = await models.Tag.findOne({ where: { name: nameTag } });
          if (tag === null) {
            tag = await models.Tag.create({ name: nameTag });
          }
          return tag;
        });

        const tags = await Promise.all(tagsPromises);
        // version is work with one tag!!!
        // const [tagOne] = await models.Tag.findOrCreate({ where: { name: 'simple' } });
        // const tags = [tagOne];

        // -- version 1 error: SQLITE_BUSY: data base is locked
        // const tagsPromises = tagsName.map(async (nameTag) => {
        //   const [tag, createdTag] = await models.Tag
        //    .findOrCreate({ where: { name: nameTag } });
        //   console.log('tag created: ', createdTag, ' name: ', nameTag);
        //   return tag;
        // });
        //
        // const tags = await Promise.all(tagsPromises);
        // console.log('tags: ', tags);

        await task.addTags(tags);

        ctx.flash.set({ info: 'Task has been created' });
        ctx.redirect(router.url('tasks'));
      } catch (e) {
        logRoute('Save task with Error!!!', e);
        const users = await models.User.findAll();
        ctx.render('tasks/new', { f: buildFormObj(task, e), data: { users } });
      }
    }) // форма редактирования задачи
    .get('editTask', '/tasks/:id/edit', async (ctx, next) => {
      const { id: taskId } = ctx.params;

      const task = await models.Task.findOne({
        where: { id: taskId },
        include: ['tags', 'assigned', 'status', 'creator'],
      });
      if (!task) {
        next();
        return;
      }
      logRoute('Task edit: ', task.get({ plain: true }));
      const users = await models.User.findAll();
      const statuses = await models.TaskStatus.findAll();
      ctx.render('tasks/edit', { f: buildFormObj(task), data: { users, statuses } });
    }) // редактирование задачи
    .patch('editTaskPatch', '/tasks/:id', async (ctx, next) => {
      const { id: taskId } = ctx.params;
      const { request: { body: { form } } } = ctx;

      const task = await models.Task.findOne({
        where: { id: taskId },
        include: ['tags', 'assigned', 'status', 'creator'],
      });
      if (!task) {
        next();
        return;
      }
      try {
        await task.update(form);
        ctx.flash.set({ info: 'Has been updated' });
        ctx.redirect(router.url('task', taskId));
      } catch (e) {
        logRoute('Update tasks with Error!!!', e.errors);
        const users = await models.User.findAll();
        const statuses = await models.TaskStatus.findAll();
        ctx.render('tasks/edit', { f: buildFormObj(task, e), data: { users, statuses } });
      }
    }) // удаление задачи
    .delete('deleteTask', '/tasks/:id', async (ctx, next) => {
      const userIdsession = ctx.session.userId;
      const { id: taskId } = ctx.params;
      const task = await models.Task.findOne({ where: { id: taskId } });
      if (!task) {
        next();
        return;
      }
      if (userIdsession.toString() !== task.creatorId.toString()) {
        ctx.flash.set({ danger: 'You are not autorized to remove this task!' });
        ctx.redirect(router.url('tasks'));
        return;
      }
      await models.Task.destroy({
        where: {
          id: task.id,
        },
      });
      ctx.flash.set({ info: 'Task has been deleted!' });
      ctx.redirect(router.url('tasks'));
    });
};
