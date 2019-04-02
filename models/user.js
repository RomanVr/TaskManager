import Sequelize from 'sequelize';
import { encrypt } from '../lib/secure';

export default (sequelize, DataTypes) => {
  class User extends Sequelize.Model {
    get fullName() {
      return `${this.firstName} ${this.lastName}`;
    }
  }
  User.init({
    firstName: DataTypes.STRING,
    lastName: DataTypes.STRING,
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    passwordDigest: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: true,
      },
    },
    password: {
      type: DataTypes.VIRTUAL,
      set(value) {
        this.setDataValue('passwordDigest', encrypt(value));
        this.setDataValue('password', value);
        return value;
      },
      validate: {
        len: [1, +Infinity],
      },
    },
  }, {
    freezeTableName: true,
    sequelize,
  });

  return User;
};
