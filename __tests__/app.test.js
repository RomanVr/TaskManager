import request from 'supertest';
import matchers from 'jest-supertest-matchers';

import db from '../models';
import app from '..';

let fakePerson;
let server;

describe('Requests without access and authenticate', () => {
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
    await request.agent(server)
      .get('/session/new')
      .expect(200);
  });

  it('Users GET, 200', async () => {
    await request.agent(server)
      .get('/users')
      .expect(200);
  });

  it('User new, GET 200', async () => {
    const response = await request.agent(server)
      .get('/users/new');
    expect(response).toHaveHTTPStatus(200);
  });

  it('User save to db, 302', async () => {
    const response = await request.agent(server)
      .post('/users')
      .send({ form: fakePerson });
    expect(response.status).toEqual(302);
  });

  it('User save wrong, 200', async () => {
    await request.agent(server)
      .post('/users')
      .send({ form: { email: '' } })
      .expect(200);
  });

  it('Session new, POST 302', async () => {
    const response = await request.agent(server)
      .post('/session')
      .send({ form: fakePerson });
    expect(response.headers.location).toEqual('/');
  });

  it('Session new, POST 302 Registration fail!', async () => {
    const response = await request.agent(server)
      .post('/session')
      .send({ form: { email: '' } })
      .expect(302);
    console.log('Location: ', response.headers.location);
    expect(response.headers.location).toEqual('/session/new');
  });

  it('Session DELETE, 200', async () => {
    await request.agent(server)
      .post('/session')
      .send({ form: fakePerson })
      .expect(302);

    const response = await request.agent(server)
      .delete('/session')
      .expect(302);
    expect(response.headers.location).toEqual('/');
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

  it('Wrong URL', async () => {
    await request.agent(server)
      .get('/wrongUrl')
      .set('cookie', cookie)
      .expect(404);
  });

  it('User edit GET, 200', async () => {
    await request.agent(server)
      .get('/users/1/edit')
      .set('cookie', cookie)
      .expect(200);
  });

  it('User edit wrong userId GET, 404', async () => {
    await request.agent(server)
      .get('/users/2/edit')
      .set('cookie', cookie)
      .expect(404);
  });

  it('User PATCH, 302', async () => {
    const response = await request.agent(server)
      .patch('/users/1')
      .send({ form: { lastName: 'n' } })
      .set('cookie', cookie)
      .expect(302);
    expect(response.headers.location).toEqual('/');
  });

  it('User PATCH wron userId, 302', async () => {
    const response = await request.agent(server)
      .patch('/users/2')
      .send({ form: { lastName: 'n' } })
      .set('cookie', cookie)
      .expect(302);
    expect(response.headers.location).toEqual('/');
  });

  it('User PATCH wrong update email, 200', async () => {
    await request.agent(server)
      .patch('/users/1')
      .send({ form: { email: '' } })
      .set('cookie', cookie)
      .expect(200);
  });

  it('User DELETE wrong userId, 302', async () => {
    await request.agent(server)
      .delete('/users/2')
      .set('cookie', cookie)
      .expect(302);
  });

  it('User DELETE, 302', async () => {
    await request.agent(server)
      .delete('/users/1')
      .set('cookie', cookie)
      .expect(302);
  });

  afterEach((done) => {
    server.close();
    done();
  });
});
