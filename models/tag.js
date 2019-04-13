import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class Tag extends Model {}

  Tag.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
  }, {
    freezeTableName: true,
    sequelize,
  });

  Tag.associate = function associate(models) {
    models.Tag.belongsToMany(models.Task, {
      as: 'Tasks',
      through: 'TaskTags',
      onDelete: 'Set Null',
    });
  };

  return Tag;
};
