import request from 'supertest';
import matchers from 'jest-supertest-matchers';

import db from '../models';
import app from '..';

let fakePerson;
let server;
let cookie;
let user;
let task;
let status;

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
    await expect(response).toHaveHTTPStatus(200);
  });

  it('Wrong enter in auth zone GET, 302', async () => {
    const response = await request.agent(server)
      .get('/tasks');
    await expect(response.headers.location).toEqual('/');
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
    await expect(response).toHaveHTTPStatus(200);
  });

  it('User save to db, 302', async () => {
    const response = await request.agent(server)
      .post('/users')
      .send({ form: fakePerson });
    await expect(response.status).toEqual(302);
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
    await expect(response.headers.location).toEqual('/');
  });

  it('Session new, POST 302 Registration fail!', async () => {
    const response = await request.agent(server)
      .post('/session')
      .send({ form: { email: '' } })
      .expect(302);
    await expect(response.headers.location).toEqual('/session/new');
  });

  it('Session DELETE, 200', async () => {
    await request.agent(server)
      .post('/session')
      .send({ form: fakePerson })
      .expect(302);

    const response = await request.agent(server)
      .delete('/session')
      .expect(302);
    await expect(response.headers.location).toEqual('/');
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

    [status] = await db.TaskStatus.findOrCreate({ where: { name: 'New' } });
    const fakeTask = {
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
      await expect(response.status).toEqual(200);
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
      await expect(response.headers.location).toEqual('/');
    });

    it('User PATCH wron userId, 302', async () => {
      const response = await request.agent(server)
        .patch('/users/3')
        .send({ form: { lastName: 'n' } })
        .set('cookie', cookie)
        .expect(302);
      await expect(response.headers.location).toEqual('/');
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
        .delete(`/tags/${tagTest.id}/tasks/${task.id}`)
        .set('cookie', cookie);
      await expect(response.headers.location).toEqual(`/tasks/${task.id}`);
    });

    it('POST empty name tag, 302', async () => {
      await request.agent(server)
        .post(`/tags/${task.id}`)
        .send({ form: { name: '' } })
        .set('cookie', cookie)
        .expect(302);
    });
  });

  describe('Requests Task', () => {
    const wrongIdtask = 10;
    let deleteTaskTest;
    let testTask;

    it('GET, 200', async () => {
      await request.agent(server)
        .get('/tasks')
        .set('cookie', cookie)
        .expect(200);
    });

    it('GET with query, 200', async () => {
      await request.agent(server)
        .get('/tasks')
        .query({ nameTask: 'test' })
        .set('cookie', cookie)
        .expect(200);
    });

    it('GET with query "MeTask", 200', async () => {
      await request.agent(server)
        .get('/tasks')
        .query({ meTask: 'yes' })
        .set('cookie', cookie)
        .expect(200);
    });

    it('GET new Task, 200', async () => {
      await request.agent(server)
        .get('/tasks/new')
        .set('cookie', cookie)
        .expect(200);
    });

    it('GET task id, 200', async () => {
      await request.agent(server)
        .get(`/tasks/${task.id}`)
        .set('cookie', cookie)
        .expect(200);
    });

    it('GET task id wron id, 404', async () => {
      await request.agent(server)
        .get(`/tasks/${wrongIdtask}`)
        .set('cookie', cookie)
        .expect(404);
    });

    it('POST tasks, 302', async () => {
      const testTask1 = {
        name: 'test',
        creatorId: user.id,
        assignedId: user.id,
        description: 'test',
        statusId: status.id,
        tags: 'test1, test2',
      };
      await request.agent(server)
        .post('/tasks')
        .send({ form: testTask1 })
        .set('cookie', cookie)
        .expect(302);

      const testTask2 = {
        name: 'test',
        creatorId: user.id,
        assignedId: user.id,
        description: 'test',
        statusId: status.id,
        tags: 'test1',
      };
      await request.agent(server)
        .post('/tasks')
        .send({ form: testTask2 })
        .set('cookie', cookie)
        .expect(302);

      const testTask3 = {
        name: 'test',
        creatorId: user.id,
        assignedId: user.id,
        description: 'test',
        statusId: status.id,
        tags: '',
      };
      await request.agent(server)
        .post('/tasks')
        .send({ form: testTask3 })
        .set('cookie', cookie)
        .expect(302);
    });

    it('POST tasks with constraint, 200', async () => {
      testTask = {
        name: '',
        creatorId: user.id,
        assignedId: user.id,
        description: 'test',
        statusId: status.id,
        tags: '',
      };
      await request.agent(server)
        .post('/tasks')
        .send({ form: testTask })
        .set('cookie', cookie)
        .expect(200);
    });

    it('GET form task edit, 200', async () => {
      await request.agent(server)
        .get(`/tasks/${task.id}/edit`)
        .set('cookie', cookie)
        .expect(200);
    });

    it('GET form wrong task edit, 404', async () => {
      await request.agent(server)
        .get(`/tasks/${wrongIdtask}/edit`)
        .set('cookie', cookie)
        .expect(404);
    });

    it('PATCH tasks, 302', async () => {
      const taskEdit = { name: 'newName' };
      const response = await request.agent(server)
        .patch(`/tasks/${task.id}`)
        .send({ form: taskEdit })
        .set('cookie', cookie);
      await expect(response.headers.location).toEqual(`/tasks/${task.id}`);
    });

    it('PATCH tasks wrong task id, 404', async () => {
      const taskEdit = { name: 'newName' };
      await request.agent(server)
        .post(`/tasks/${wrongIdtask}`)
        .send({ form: taskEdit, _method: 'patch' })
        .set('cookie', cookie)
        .expect(404);
    });

    it('PATCH tasks wrong name, 200', async () => {
      const taskEdit = { name: '' };
      await request.agent(server)
        .patch(`/tasks/${task.id}`)
        .send({ form: taskEdit })
        .set('cookie', cookie)
        .expect(200);
    });

    it('DELETE tasks, 302', async () => {
      deleteTaskTest = {
        name: 'testDelete',
        creatorId: user.id,
        assignedId: user.id,
        description: 'test',
        statusId: status.id,
        tagsName: 'test',
      };
      const taskDelete = await db.Task.create(deleteTaskTest);
      const response = await request.agent(server)
        .delete(`/tasks/${taskDelete.id}`)
        .set('cookie', cookie);
      await expect(response.headers.location).toEqual('/tasks');
    });

    it('DELETE tasks wrong task id, 404', async () => {
      await request.agent(server)
        .delete(`/tasks/${wrongIdtask}`)
        .set('cookie', cookie)
        .expect(404);
    });

    it('DELETE task wron user auth, 302', async () => {
      const userTest = {
        lastName: 'lastNametest',
        firstName: 'firstNameTest',
        email: 't@test.ru',
        password: 'test',
      };
      const newUser = await db.User.create(userTest);
      await server.close();
      server = app().listen();
      const response = await request.agent(server)
        .post('/session')
        .send({ form: newUser });
      cookie = response.headers['set-cookie'];

      const responseDelete = await request.agent(server)
        .delete(`/tasks/${task.id}`)
        .set('cookie', cookie);
      await expect(responseDelete.headers.location).toEqual('/tasks');
    });
  });

  describe('Requests Statuses', () => {
    let testTask;

    it('GET, 200', async () => {
      await request.agent(server)
        .get('/statuses')
        .set('cookie', cookie)
        .expect(200);
    });

    it('POST, 302', async () => {
      const nameStatus = 'test';
      await request.agent(server)
        .post('/statuses')
        .send({ form: { name: nameStatus } })
        .set('cookie', cookie)
        .expect(302);
    });

    it('POST whit empty name status, 200', async () => {
      await request.agent(server)
        .post('/statuses')
        .send({ form: { name: '' } })
        .set('cookie', cookie)
        .expect(200);
    });

    it('DELETE, 302', async () => {
      const nameStatus = 'deleteStatus';
      const statusTask = await db.TaskStatus.create({ name: nameStatus });
      await request.agent(server)
        .delete(`/statuses/${statusTask.id}`)
        .set('cookie', cookie)
        .expect(302);
    });

    it('DELETE wrong status, 404', async () => {
      const wrongId = 10;
      await request.agent(server)
        .delete(`/statuses/${wrongId}`)
        .set('cookie', cookie)
        .expect(404);
    });

    it('DELETE constraint status, 302', async () => {
      const nameStatus = 'deleteStatus';
      const testStatus = await db.TaskStatus.create({ name: nameStatus });
      testTask = {
        name: 'test',
        creatorId: user.id,
        assignedId: user.id,
        description: 'test',
        statusId: testStatus.id,
        tags: 'test',
      };
      await db.Task.create(testTask);
      await request.agent(server)
        .delete(`/statuses/${testStatus.id}`)
        .set('cookie', cookie)
        .expect(302);
    });
  });

  afterEach((done) => {
    server.close();
    done();
  });
});
