import request from 'supertest';
import matchers from 'jest-supertest-matchers';

import db from '../models';
import app from '..';

let fakePerson;
let fakeTask;
let server;
let cookie;
let user;
let task;

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

  it('Wrong enter in auth zone GET, 302', async () => {
    const response = await request.agent(server)
      .get('/tasks');
    expect(response.headers.location).toEqual('/');
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

describe('Requests with authenticate', () => {
  beforeAll(async () => {
    expect.extend(matchers);
    await db.sequelize.sync({ force: true });
    fakePerson = {
      lastName: 'lName',
      firstName: 'fName',
      email: 'ex@ex.ru',
      password: 'qwetry',
    };
    user = await db.User.create(fakePerson);

    const [status] = await db.TaskStatus.findOrCreate({ where: { name: 'New' } });
    fakeTask = {
      name: 'test',
      creatorId: user.id,
      assignedId: user.id,
      description: 'test',
      statusId: status.id,
    };
    task = await db.Task.create(fakeTask);
  });

  beforeEach(async () => {
    server = app().listen();
    const response = await request.agent(server)
      .post('/session')
      .send({ form: fakePerson });
    cookie = response.headers['set-cookie'];
  });

  describe('Requests User', () => {
    let formDeleteUser;
    let userDelete;

    beforeAll(async () => {
      formDeleteUser = {
        lastName: 'lastNametest',
        firstName: 'firstNameTest',
        email: 't@test.ru',
        password: 'test',
      };
      userDelete = await db.User.create(formDeleteUser);
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
        .get('/users/3/edit')
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
        .patch('/users/3')
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
      await server.close();
      server = app().listen();
      const response = await request.agent(server)
        .post('/session')
        .send({ form: formDeleteUser });
      cookie = response.headers['set-cookie'];
      await request.agent(server)
        .delete(`/users/${userDelete.id}`)
        .set('cookie', cookie)
        .expect(302);
    });

    it('User DELETE with consrtain, 302', async () => {
      await request.agent(server)
        .delete(`/users/${user.id}`)
        .set('cookie', cookie)
        .expect(302);
    });
  });

  describe('Requests Tag', () => {
    it('POST, 302', async () => {
      await request.agent(server)
        .post(`/tags/${task.id}`)
        .send({ form: { name: 'tag1' } })
        .set('cookie', cookie)
        .expect(302);
    });

    it('DELETE, 302', async () => {
      const tagTest = await db.Tag.create({ name: 'test' });
      await task.addTag(tagTest);
      const response = await request.agent(server)
        .delete(`/tags/${tagTest.id}/${task.id}`)
        .set('cookie', cookie);
      expect(response.headers.location).toEqual(`/tasks/${task.id}`);
    });
  });

  describe('Requests Task', () => {
    it('GET, 200', async () => {
      await request.agent(server)
        .get('/tasks')
        .set('cookie', cookie)
        .expect(200);
    });
  });

  afterEach((done) => {
    server.close();
    done();
  });
});
