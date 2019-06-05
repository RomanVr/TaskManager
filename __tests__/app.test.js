import request from 'supertest';
import matchers from 'jest-supertest-matchers';

import db from '../models';
import app from '..';

describe('requests', () => {
  let server;

  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    expect.extend(matchers);
  });

  beforeEach(() => {
    server = app().listen();
  });

  it('Root, GET 200', async () => {
    const response = await request.agent(server)
      .get('/');
    expect(response).toHaveHTTPStatus(200);
  });

  it('Session new, GET 200', async () => {
    await request.agent(server).get('/session/new').expect(200);
  });

  it('User new, GET 200', async () => {
    const response = await request.agent(server)
      .get('/users/new');
    expect(response).toHaveHTTPStatus(200);
  });

  afterEach((done) => {
    server.close();
    done();
  });
});
