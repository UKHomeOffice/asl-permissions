const supertest = require('supertest');
const sinon = require('sinon');
const assert = require('assert');

const API = require('../lib/api');
const User = require('./helpers/user-wrapper.js');

const stubProfile = (Profile, response) => {
  const q = {
    where: () => q,
    eager: () => Promise.resolve([response])
  };
  sinon.stub(Profile, 'query').returns(q);
};

describe('API', () => {

  beforeEach(() => {
    this.api = API({
      db: {},
      log: {
        level: 'silent'
      },
      permissions: {
        task1: ['establishment:admin'],
        task2: ['inspector'],
        task3: {
          task3a: ['establishment:admin', 'establishment:readonly', 'establishment:basic', 'inspector']
        }
      }
    });
  });

  afterEach(() => {
    try {
      this.api.db.Profile.query.restore();
    } catch (e) {}
  });

  describe('when user is an establishment admin', () => {

    beforeEach(() => {
      const user = { id: '100' };
      this.app = User(this.api, user);
      stubProfile(this.api.db.Profile, {
        establishments: [
          {
            id: 100,
            role: 'admin'
          }
        ]
      });
    });

    it('returns 404 for unknown tasks', () => {
      return supertest(this.app)
        .get('/not-a-task')
        .expect(404);
    });

    it('returns 403 for tasks which do not have "establishment:admin" as a role', () => {
      return supertest(this.app)
        .get('/task2')
        .expect(403);
    });

    it('returns 403 for tasks which have "establishment:admin" as a role when called for a different establishment', () => {
      return supertest(this.app)
        .get('/task1?establishment=101')
        .expect(403);
    });

    it('returns 200 for tasks which have "establishment:admin" as a role when called with the users establishment', () => {
      return supertest(this.app)
        .get('/task1?establishment=100')
        .expect(200);
    });

    it('returns 200 for tasks which have "establishment:admin" as one of multiple roles', () => {
      return supertest(this.app)
        .get('/task3.task3a?establishment=100')
        .expect(200);
    });

  });

  describe('when user is an establishment basic user', () => {

    beforeEach(() => {
      const user = { id: '100' };
      this.app = User(this.api, user);
      stubProfile(this.api.db.Profile, {
        establishments: [
          {
            id: 100,
            role: 'basic'
          }
        ]
      });
    });

    it('returns 403 for tasks which have "establishment:admin" as a role', () => {
      return supertest(this.app)
        .get('/task1?establishment=100')
        .expect(403);
    });

    it('returns 200 for tasks which have "establishment:basic" as one of multiple roles', () => {
      return supertest(this.app)
        .get('/task3.task3a?establishment=100')
        .expect(200);
    });

  });

  describe('profile:own permissions', () => {

    const id = '3076871b-0aa7-4890-abbc-9e12c7c4af84';

    beforeEach(() => {
      this.api = API({
        db: {},
        log: {
          level: 'silent'
        },
        permissions: {
          profile: {
            update: ['profile:own']
          }
        }
      });

      this.app = User(this.api, { id });
      stubProfile(this.api.db.Profile, { id });
    });

    it('allows if own profile', () => {
      return supertest(this.app)
        .get(`/profile.update?id=${id}`)
        .expect(200);
    });

    it('doesn\'t allow if different profile', () => {
      return supertest(this.app)
        .get('/profile.update?id=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
        .expect(403);
    });
  });

  xdescribe('when user is an inspector', () => {

    beforeEach(() => {
      const user = {
        is: role => role === 'inspector', // user is an inspector
        get: prop => null // user has no establishment
      };
      this.app = User(this.api, user);
    });

    it('returns 403 for unknown tasks', () => {
      return supertest(this.app)
        .get('/not-a-task')
        .expect(403);
    });

    it('returns 403 for tasks which do not have "inspector" as a role', () => {
      return supertest(this.app)
        .get('/task1')
        .expect(403);
    });

    it('returns 200 for tasks which have "inspector" as a role', () => {
      return supertest(this.app)
        .get('/task2')
        .expect(200);
    });

    it('returns 200 for tasks which have "inspector" as a role irrespective of establishment id', () => {
      return supertest(this.app)
        .get('/task2?establishment=101')
        .expect(200);
    });

    it('returns 200 for tasks which have "inspector" as one of multiple roles', () => {
      return supertest(this.app)
        .get('/task3.task3a')
        .expect(200);
    });

  });

  describe('getTasks', () => {
    beforeEach(() => {
      const user = { id: '100' };
      this.app = User(this.api, user);
    });

    it('returns a list of actions the user can perform', () => {
      stubProfile(this.api.db.Profile, {
        establishments: [
          {
            id: 100,
            role: 'basic'
          }
        ]
      });
      return supertest(this.app)
        .get('/')
        .expect(200)
        .expect(response => {
          assert(response.body.hasOwnProperty(100), 'response contains a section for establishment `100`');
          assert.deepEqual(response.body[100], [
            'task3.task3a'
          ]);
        });
    });

    it('scopes to an establishment', () => {
      stubProfile(this.api.db.Profile, {
        establishments: [
          {
            id: 100,
            role: 'basic'
          },
          {
            id: 101,
            role: 'admin'
          },
          {
            id: 102,
            role: 'readonly'
          }
        ]
      });
      return supertest(this.app)
        .get('/')
        .expect(200)
        .expect(response => {
          assert(response.body.hasOwnProperty(100), 'response contains a section for establishment `100`');
          assert(response.body.hasOwnProperty(101), 'response contains a section for establishment `101`');
          assert(response.body.hasOwnProperty(102), 'response contains a section for establishment `102`');
          assert.deepEqual(response.body[100], ['task3.task3a']);
          assert.deepEqual(response.body[101], ['task1', 'task3.task3a']);
          assert.deepEqual(response.body[102], ['task3.task3a']);
        });
    });

    it('includes global tasks which are not scoped under an establishment', () => {
      stubProfile(this.api.db.Profile, {
        establishments: [
          {
            id: 100,
            role: 'basic'
          }
        ]
      });
      return supertest(this.app)
        .get('/')
        .expect(200)
        .expect(response => {
          assert(response.body.hasOwnProperty('global'), 'response contains a section for globally allowed tasks');
        });
    });

    it('returns 400 if the profile cannot be found', () => {
      stubProfile(this.api.db.Profile, null);
      return supertest(this.app)
        .get('/')
        .expect(400);
    });
  });

});
