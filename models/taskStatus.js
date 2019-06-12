import { Model } from 'sequelize';
// import statuses from '../lib/taskStatus';

export default (sequelize, DataTypes) => {
  class TaskStatus extends Model {}

  TaskStatus.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
      },
    },
  }, {
    freezeTableName: true,
    sequelize,
  });

  return TaskStatus;
};
