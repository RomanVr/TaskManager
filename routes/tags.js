import models from '../models';
import { logRoute } from '../lib/logger';

export default (router) => {
  router// удалить tag
    .delete('deleteTag', '/tags/:tagId/:taskId', async (ctx) => {
      logRoute('In DELETE Tag!!!');
      const { tagId, taskId } = ctx.params;
      logRoute('tagId: ', tagId, ' taskId: ', taskId);
      const tag = await models.Tag.findOne({ where: { id: tagId } });
      const task = await models.Task.findOne({ where: { id: taskId } });
      await task.removeTag(tag);
      ctx.redirect(router.url('task', task.id));
    })// новый tag
    .post('newTag', '/tags/:taskId', async (ctx) => {
      logRoute('In POST tag');
      const { taskId } = ctx.params;
      logRoute('Task id: ', taskId);
      const { request: { body: { form } } } = ctx;
      logRoute('form data: ', JSON.stringify(form));
      try {
        const [tag] = await models.Tag.findOrCreate({ where: { name: form.name } });
        const task = await models.Task.findOne({ where: { id: taskId } });

        await task.addTag(tag);
      } catch (e) {
        logRoute('Add tag with Error!!!');
        ctx.flash.set({ message: `Error \n${e.message}`, div: 'alert-danger' });
      }
      ctx.redirect(router.url('task', taskId));
    });
};
