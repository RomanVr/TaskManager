import request from 'supertest';
import matchers from 'jest-supertest-matchers';

import db from '../models';
import app from '..';

describe('Requests without access', () => {
  let server;

  beforeAll(async () => {
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

describe('Request with authenticate', () => {
  let serverAuth;
  let cookie;
  let fakePerson;

  beforeAll(async () => {
    expect.extend(matchers);
    await db.sequelize.sync({ force: true });
    fakePerson = {
      lastName: 'lName',
      firstName: 'fName',
      email: 'ex@ex.ru',
      password: 'qwetry',
    };
  });

  beforeEach(() => {
    serverAuth = app().listen();
  });
  // move to beforeAll
  it('User save to db', async () => {
    const response = await request.agent(serverAuth)
      .post('/users')
      .send({ form: fakePerson });
    expect(response.status).toEqual(302);
  });

  // move to beforeEach
  it('User auth', async () => {
    const response = await request.agent(serverAuth)
      .post('/session')
      .send({ form: fakePerson });
    expect(response.headers.location).toEqual('/');
    cookie = response
      .headers['set-cookie'][0]
      .split(',')
      .map(item => item.split(';')[0])
      .join(';');
    console.log('response cookie: ', response.headers['set-cookie']);
    console.log('cookie: ', cookie);
  });

  // it('User enter in auth zone', async () => {
  //   const response = await request.agent(serverAuth)
  //     .get('/tasks')
  //     .set('Cookie', cookie);
  //   expect(response).toHaveHTTPStatus(200);
  // });

  afterEach((done) => {
    serverAuth.close();
    done();
  });
});
