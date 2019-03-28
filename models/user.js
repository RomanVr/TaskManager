import { encrypt } from '../lib/secure';

export default (sequelize, DataTypes) => {
  class User extends sequelize.Model {
    get fullName() {
      return `${this.firstName} ${this.lastName}`;
    }
  }
  User.init({
    firstName: DataTypes.STRING,
    lastName: DataTypes.STRING,
    email: {
      type: DataTypes,
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
    sequelize,
  });

  return User;
};
