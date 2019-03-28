export default {
  development: {
    storage: './db.development.sqlite',
    dialect: 'sqlite',
  },
  test: {
    storage: ':memory:',
    dialect: 'sqlite',
  },
  production: {
    username: 'root',
    password: null,
    database: 'db_production',
    dialect: 'postgres',
  },
};
