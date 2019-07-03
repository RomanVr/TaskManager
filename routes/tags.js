import models from '../models';
import { logRoute } from '../lib/logger';

export default (router) => {
  router// удалить tag
    .delete('deleteTag', '/tags/:tagId/tasks/:taskId', async (ctx) => {
      const { tagId, taskId } = ctx.params;
      const tag = await models.Tag.findOne({ where: { id: tagId } });
      const task = await models.Task.findOne({ where: { id: taskId } });
      await task.removeTag(tag);
      ctx.redirect(router.url('task', task.id));
    })// новый tag
    .post('newTag', '/tags/:taskId', async (ctx) => {
      const { taskId } = ctx.params;
      const { request: { body: { form } } } = ctx;
      try {
        const [tag] = await models.Tag.findOrCreate({ where: { name: form.name } });
        const task = await models.Task.findOne({ where: { id: taskId } });

        await task.addTag(tag);
      } catch (e) {
        logRoute('Add tag with Error!!!');
        ctx.flash.set({ danger: `Error \n${e.message}` });
      }
      ctx.redirect(router.url('task', taskId));
    });
};
