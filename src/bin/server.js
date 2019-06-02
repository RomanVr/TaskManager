import { logApp } from '../../container';
import solution from '../..';
import models from '../../models';
import taskStatuses from '../../lib/taskStatus';

const PORT = process.env.PORT || 5000;

models.sequelize.sync()
  .then(() => {
    taskStatuses.forEach(async (statusName) => {
      const taskStatus = await models.TaskStatus.findOne({
        where: { name: statusName },
      });
      if (taskStatus === null) {
        await models.TaskStatus.create({ name: statusName });
      }
    });
  })
  .then(() => {
    solution().listen(PORT, () => {
      logApp(`Server was started on '${PORT}'`);
    });
  });
