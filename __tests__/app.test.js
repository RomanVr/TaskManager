import request from 'supertest';
import matchers from 'jest-supertest-matchers';

import db from '../models';
import app from '..';

let fakePerson;
let server;

describe('Requests without access', () => {
  beforeAll(async () => {
    expect.extend(matchers);
    fakePerson = {
      lastName: 'lName',
      firstName: 'fName',
      email: 'ex@ex.ru',
      password: 'qwetry',
    };
    await db.sequelize.sync({ force: true });
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

  it('User save to db', async () => {
    const response = await request.agent(server)
      .post('/users')
      .send({ form: fakePerson });
    expect(response.status).toEqual(302);
  });

  afterEach((done) => {
    server.close();
    done();
  });
});

describe('Request with authenticate', () => {
  let cookie;

  beforeAll(async () => {
    expect.extend(matchers);
    await db.sequelize.sync({ force: true });
    fakePerson = {
      lastName: 'lName',
      firstName: 'fName',
      email: 'ex@ex.ru',
      password: 'qwetry',
    };
    await db.User.create(fakePerson);
  });

  beforeEach(async () => {
    server = app().listen();
    const response = await request.agent(server)
      .post('/session')
      .send({ form: fakePerson });
    cookie = response.headers['set-cookie'];
  });

  it('User enter in auth zone', async () => {
    const response = await request.agent(server)
      .get('/tasks')
      .set('cookie', cookie);
    expect(response.status).toEqual(200);
  });

  afterEach((done) => {
    server.close();
    done();
  });
});
