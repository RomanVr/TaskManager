import Express from 'express';

export default () => {
  const app = new Express();
  app.get('/', (req, res) => res.send('Hello World!'));

  return app;
};
