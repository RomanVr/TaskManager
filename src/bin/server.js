import solution from '../index';

const PORT = process.env.PORT || 5000;
solution().listen(PORT, () => {
  /* eslint-disable no-console */
  console.log(`Server was started on '${PORT}'`);
});
