import { Model } from 'sequelize';
import statuses from '../lib/taskStatus';

export default (sequelize, DataTypes) => {
  class TaskStatus extends Model {}

  TaskStatus.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [statuses],
      },
    },
  }, {
    freezeTableName: true,
    sequelize,
  });

  return TaskStatus;
};
