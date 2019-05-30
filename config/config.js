export default {
  development: {
    storage: './db.development.sqlite',
    dialect: 'sqlite',
    pool: {
      min: 3,
      max: 10,
      idle: 10000,
    },
  },
  test: {
    storage: ':memory:',
    dialect: 'sqlite',
  },
  production: process.env.DATABASE_URL,
};
