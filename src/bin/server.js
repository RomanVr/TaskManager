import '../../container';
import solution from '../..';
import models from '../../models';

const PORT = process.env.PORT || 5000;

models.sequelize.sync()
  .then(() => {
    solution().listen(PORT, () => {
      /* eslint-disable no-console */
      console.log(`Server was started on '${PORT}'`);
    });
  });
