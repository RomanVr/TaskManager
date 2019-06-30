import models from '../models';
import buildFormObj from '../lib/formObjectBuilder';
import { logRoute } from '../lib/logger';

export default (router) => {
  router
    .get('statuses', '/statuses', async (ctx) => {
      const statuses = await models.TaskStatus.findAll();
      const status = await models.TaskStatus.build();
      ctx.render('statuses', { f: buildFormObj(status), statuses });
    })
    // .get('newStatus', '/statuses/new')
    .post('statusesPost', '/statuses', async (ctx) => {
      const { request: { body: { form } } } = ctx;
      const status = await models.TaskStatus.build(form);
      try {
        await status.save();
        ctx.flash.set({ message: 'Status has been created', div: 'alert-info' });
        ctx.redirect(router.url('statuses'));
      } catch (e) {
        logRoute('Save status with error');
        const statuses = await models.TaskStatus.findAll();
        ctx.render('statuses', { f: buildFormObj(status, e), statuses });
      }
    })
    .delete('statusesDelete', '/statuses/:id', async (ctx, next) => {
      const { id: statusId } = ctx.params;
      const status = await models.TaskStatus.findOne({ where: { id: statusId } });
      if (!status) {
        next();
        return;
      }
      try {
        await models.TaskStatus.destroy({ where: { id: status.id } });
        ctx.flash.set({ message: 'Status has been deleted!', div: 'alert-info' });
        ctx.redirect(router.url('statuses'));
      } catch (e) {
        logRoute('Status has not been deleted!: \n', e.message);
        ctx.flash.set({ message: `Status has not been deleted! \n${e.message}`, div: 'alert-danger' });
        ctx.redirect(router.url('statuses'));
      }
    });
};
