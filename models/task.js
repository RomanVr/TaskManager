import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class Task extends Model {}

  Task.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: DataTypes.STRING,
    status: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {
    freezeTableName: true,
    // underscored: true,
    sequelize,
  });

  Task.associate = function associate(models) {
    models.Task.belongsTo(models.User, {
      as: 'creator',
      onDelete: 'RESTRICT',
      foreignKey: {
        allowNull: false,
      },
    });
    models.Task.belongsTo(models.User, {
      as: 'assignedTo',
      onDelete: 'Set Null',
      foreignKey: {
        allowNull: true,
      },
    });
    models.Task.belongsToMany(models.Tag, {
      as: 'Tags',
      through: 'TaskTags',
      onDelete: 'Set Null',
    });
    models.Task.belongsToMany(models.TaskStatus, {
      as: 'Statuses',
      through: 'taskStatuses',
      onDelete: 'Set Null',
    });
  };

  return Task;
};
