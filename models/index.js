import Sequelize from 'sequelize';
import path from 'path';
import Config from '../config/config';

const env = process.env.NODE_ENV || 'development';
const config = Config[env];

const db = {};

const sequelize = new Sequelize(config.database, config.username, config.password, config);
sequelize
  .authenticate()
  .then(() => {
    console.log('Success connection!!!');
  })
  .catch((err) => {
    console.log('Failed connection!!!', err);
  });
const model = sequelize.import(path.join(__dirname, 'user.js'));
db[model.name] = model;

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

export default db;
