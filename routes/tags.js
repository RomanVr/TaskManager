import models from '../models';

export default (router) => {
  router// удалить tag
    .delete('deleteTag', '/tags/:tagId/:taskId', async (ctx) => {
      // console.log('In delete Tag!!!');
      const { tagId, taskId } = ctx.params;
      // console.log('tagId: ', tagId, ' taskId: ', taskId);
      const tag = await models.Tag.findOne({ where: { id: tagId } });
      const task = await models.Task.findOne({ where: { id: taskId } });
      await task.removeTag(tag);
      // console.log('tag name: ', tag.name, ' task id: ', taskId);
      ctx.redirect(`/tasks/${task.id}`);
    })// новый tag
    .post('tag', '/tags/:taskId', async (ctx) => {
      // console.log('In post tag!!!');
      const { taskId } = ctx.params;
      const { request: { body: { form } } } = ctx;
      // console.log('form data: ', JSON.stringify(form));
      const [tag] = await models.Tag.findOrCreate({ where: { name: form.name } });
      const task = await models.Task.findOne({ where: { id: taskId } });

      await task.addTag(tag);

      ctx.redirect(`/tasks/${task.id}`);
    });
};
