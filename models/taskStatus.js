import { Model } from 'sequelize';
import statuses from './lib/taskStatus';

console.log('statuses: ', statuses);

export default (sequelize, DataTypes) => {
  class TaskStatus extends Model {}

  TaskStatus.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: statuses[0],
      validate: {
        isIn: [statuses],
      },
    },
  }, {
    freezeTableName: true,
    sequelize,
  });

  TaskStatus.associate = function associate(models) {
    models.TaskStatus.belongsToMany(models.Task, {
      as: 'Tasks',
      through: 'taskStatuses',
      onDelete: 'Set Null',
    });
  };

  return TaskStatus;
};
