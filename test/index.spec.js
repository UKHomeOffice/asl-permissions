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
        level: 'error'
      },
      permissions: {
        task1: ['establishment:admin'],
        task2: ['asru:inspector'],
        task3: {
          task3a: ['establishment:admin', 'establishment:readonly', 'establishment:basic', 'asru:inspector']
        },
        task4: ['asru:*'],
        task5: ['establishment:role:ntco']
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
        ],
        emailConfirmed: true
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
        ],
        emailConfirmed: true
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

  describe('when user is blocked by an establishment', () => {

    beforeEach(() => {
      const user = { id: '100' };
      this.app = User(this.api, user);
      stubProfile(this.api.db.Profile, {
        establishments: [
          {
            id: 100,
            role: 'blocked'
          },
          {
            id: 101,
            role: 'basic'
          }
        ],
        emailConfirmed: true
      });
    });

    it('returns 403 for tasks which have "establishment:basic" at blocked establishments', () => {
      return supertest(this.app)
        .get('/task3.task3a?establishment=100')
        .expect(403);
    });

    it('returns 200 for tasks which have "establishment:basic" at non-blocked establishments', () => {
      return supertest(this.app)
        .get('/task3.task3a?establishment=101')
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
      stubProfile(this.api.db.Profile, {
        id,
        emailConfirmed: true
      });
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

  describe('role based permissions', () => {

    describe('when a user has the role', () => {

      beforeEach(() => {
        const user = { id: '100' };
        this.app = User(this.api, user);
        stubProfile(this.api.db.Profile, {
          establishments: [
            {
              id: 100,
              role: 'basic'
            },
            {
              id: 101,
              role: 'basic'
            },
            {
              id: 102,
              role: 'blocked'
            }
          ],
          roles: [
            {
              establishmentId: 100,
              type: 'ntco'
            },
            {
              establishmentId: 102,
              type: 'ntco'
            }
          ],
          emailConfirmed: true
        });
      });

      it('returns 200 for establishments where the user holds the role', () => {
        return supertest(this.app)
          .get('/task5?establishment=100')
          .expect(200);
      });

      it('returns 403 for establishments where the user does not hold the role', () => {
        return supertest(this.app)
          .get('/task5?establishment=101')
          .expect(403);
      });

      it('returns 403 for establishments where the user holds the role but is blocked', () => {
        return supertest(this.app)
          .get('/task5?establishment=102')
          .expect(403);
      });

    });
    describe('when a user has a different role', () => {

      beforeEach(() => {
        const user = { id: '100' };
        this.app = User(this.api, user);
        stubProfile(this.api.db.Profile, {
          establishments: [
            {
              id: 100,
              role: 'basic'
            }
          ],
          roles: [
            {
              establishmentId: 100,
              type: 'nio'
            }
          ],
          emailConfirmed: true
        });
      });

      it('returns 403', () => {
        return supertest(this.app)
          .get('/task5?establishment=100')
          .expect(403);
      });

    });
    describe('when a user is an admin who does not hold the role', () => {

      beforeEach(() => {
        const user = { id: '100' };
        this.app = User(this.api, user);
        stubProfile(this.api.db.Profile, {
          establishments: [
            {
              id: 100,
              role: 'admin'
            }
          ],
          roles: [
            {
              establishmentId: 100,
              type: 'holc'
            }
          ],
          emailConfirmed: true
        });
      });

      it('returns 403', () => {
        return supertest(this.app)
          .get('/task5?establishment=100')
          .expect(403);
      });

    });

  });

  describe('when user is an inspector', () => {

    beforeEach(() => {
      const user = { id: '100' };
      this.app = User(this.api, user);
      stubProfile(this.api.db.Profile, {
        asruUser: true,
        asruInspector: true,
        asruLicensing: false,
        asruAdmin: false,
        asruSupport: false,
        emailConfirmed: true
      });
    });

    it('returns 404 for unknown tasks', () => {
      return supertest(this.app)
        .get('/not-a-task')
        .expect(404);
    });

    it('returns 403 for tasks which do not have "asru:inspector" as a role', () => {
      return supertest(this.app)
        .get('/task1')
        .expect(403);
    });

    it('returns 200 for tasks which have "asru:inspector" as a role', () => {
      return supertest(this.app)
        .get('/task2')
        .expect(200);
    });

    it('returns 200 for tasks which have "asru:inspector" as a role', () => {
      return supertest(this.app)
        .get('/task4')
        .expect(200);
    });

    it('returns 200 for tasks which have "asru:inspector" as a role irrespective of establishment id', () => {
      return supertest(this.app)
        .get('/task2?establishment=101')
        .expect(200);
    });

    it('returns 200 for tasks which have "asru:inspector" as one of multiple roles', () => {
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
        ],
        emailConfirmed: true
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
        ],
        emailConfirmed: true
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
        ],
        emailConfirmed: true
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

  describe('when user has unconfirmed email', () => {

    beforeEach(() => {
      const user = { id: '100' };
      this.app = User(this.api, user);
      stubProfile(this.api.db.Profile, {
        establishments: [
          {
            id: 100,
            role: 'admin'
          }
        ],
        emailConfirmed: false
      });
    });

    it('returns false for specific tasks', () => {
      return supertest(this.app)
        .get('/')
        .expect(200)
        .expect(response => {
          assert.deepEqual(response.body, {}, 'response contains no tasks');
        });
    });

    it('returns no tasks in allowed actions', () => {
      return supertest(this.app)
        .get('/task1?establishment=100')
        .expect(403);
    });
  });

});
