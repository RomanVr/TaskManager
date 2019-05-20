import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class Task extends Model {}

  Task.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: DataTypes.STRING,
  }, {
    freezeTableName: true,
    // underscored: true,
    sequelize,
  });

  Task.associate = function associate(models) {
    models.Task.belongsTo(models.User, {
      as: 'creator',
      foreignKey: {
        name: 'creatorId',
        allowNull: false,
      },
      onDelete: 'RESTRICT',
    });
    models.Task.belongsTo(models.User, {
      as: 'assigned',
      onDelete: 'Set Null',
      foreignKey: {
        name: 'assignedId',
        allowNull: true,
      },
    });
    models.Task.belongsToMany(models.Tag, {
      as: 'tags',
      through: 'TaskTags',
      onDelete: 'CASCADE',
    });
    models.Task.belongsTo(models.TaskStatus, {
      as: 'status',
      foreignKey: {
        name: 'statusId',
        allowNull: false,
      },
    });
  };

  return Task;
};
