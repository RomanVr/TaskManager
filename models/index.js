import Sequelize from 'sequelize';
import path from 'path';
import fs from 'fs';
import Config from '../config/config';

const env = process.env.NODE_ENV || 'development';
console.log('NODE_ENV: ', env);
const config = Config[env];

const db = {};

const sequelize = new Sequelize(config);
sequelize
  .authenticate()
  .then(() => {
    console.log('Success connection!!!');
  })
  .catch((err) => {
    console.log('Failed connection!!!', err);
  });
const basename = path.basename(__filename);
fs
  .readdirSync(__dirname)
  .filter(file => (file.indexOf('.') !== 0)
                  && (file !== basename)
                  && (file.slice(-3) === '.js'))
  .forEach((file) => {
    const model = sequelize.import(path.join(__dirname, file));
    console.log(`Model name load: ${model.name}`);
    db[model.name] = model;
  });

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

export default db;
