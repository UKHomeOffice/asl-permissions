const assert = require('assert');
const sinon = require('sinon');
const allowedHelper = require('../lib/utils/allowed');

describe('allowed', () => {

  let allowed = allowedHelper({});

  it('returns false for profile scoped tasks if no profile is provided', () => {
    const params = {
      permissions: ['profile:own'],
      user: {
        id: 'abc123'
      }
    };
    return Promise.resolve()
      .then(() => allowed(params))
      .then(isAllowed => {
        assert.equal(isAllowed, false);
      });
  });

  describe('pil:own', () => {
    let findStub;
    let selectStub;
    let params;
    const USER_ID = '1efe4fe4-9c9a-4d89-af91-fc5eea0014f1';
    const USER_2_ID = '970ee4ee-e70b-4b36-be98-9f16415c9012';
    const PIL_ID = '29ece18a-afeb-4dc9-a02e-734e054a40c7';

    beforeEach(() => {
      findStub = sinon.stub();
      selectStub = sinon.stub();
      const stubModels = {
        PIL: {
          queryWithDeleted: sinon.stub().returns({
            findById: findStub.returns({
              select: selectStub
            })
          })
        }
      };

      allowed = allowedHelper({ db: stubModels });

      params = {
        permissions: ['pil:own'],
        user: {
          id: USER_ID
        },
        subject: {
          pilId: PIL_ID
        }
      };
    });

    it('checks logged in user is the pil holder', () => {
      selectStub.resolves({ profileId: USER_ID });
      return Promise.resolve()
        .then(() => allowed(params))
        .then(isAllowed => {
          assert.ok(findStub.calledWith(PIL_ID), 'PIL was looked up by provided ID');
          assert.equal(isAllowed, true, 'Permission check passed');
        });
    });

    it('fails if licence holder is a different user', () => {
      selectStub.resolves({ profileId: USER_2_ID });
      return Promise.resolve()
        .then(() => allowed(params))
        .then(isAllowed => {
          assert.equal(isAllowed, false, 'Permission check failed');
        });
    });

  });

  describe('project:own', () => {
    let findStub;
    let selectStub;
    const USER_ID = '1efe4fe4-9c9a-4d89-af91-fc5eea0014f1';
    const USER_2_ID = '970ee4ee-e70b-4b36-be98-9f16415c9012';
    const PROJECT_ID = '29ece18a-afeb-4dc9-a02e-734e054a40c7';

    beforeEach(() => {
      findStub = sinon.stub();
      selectStub = sinon.stub();
      const stubModels = {
        Project: {
          queryWithDeleted: sinon.stub().returns({
            findById: findStub.returns({
              select: selectStub
            })
          })
        }
      };

      allowed = allowedHelper({ db: stubModels });
    });

    it('checks logged in user is the ppl holder', () => {
      const params = {
        permissions: ['project:own'],
        user: {
          id: USER_ID
        },
        subject: {
          projectId: PROJECT_ID
        }
      };
      selectStub.resolves({ licenceHolderId: USER_ID });
      return Promise.resolve()
        .then(() => allowed(params))
        .then(isAllowed => {
          assert.ok(findStub.calledWith(PROJECT_ID), 'PPL was looked up by provided ID');
          assert.equal(isAllowed, true, 'Permission check should pass');
        });
    });

    it('falls back to an `id` param on the subject if provided', () => {
      const params = {
        permissions: ['project:own'],
        user: {
          id: USER_ID
        },
        subject: {
          id: PROJECT_ID
        }
      };
      selectStub.resolves({ licenceHolderId: USER_ID });
      return Promise.resolve()
        .then(() => allowed(params))
        .then(isAllowed => {
          assert.ok(findStub.calledWith(PROJECT_ID), 'PPL was looked up by provided ID');
          assert.equal(isAllowed, true, 'Permission check should pass');
        });
    });

    it('fails if licence holder is a different user', () => {
      const params = {
        permissions: ['project:own'],
        user: {
          id: USER_ID
        },
        subject: {
          projectId: PROJECT_ID
        }
      };
      selectStub.resolves({ licenceHolderId: USER_2_ID });
      return Promise.resolve()
        .then(() => allowed(params))
        .then(isAllowed => {
          assert.equal(isAllowed, false, 'Permission check should fail');
        });
    });

  });

  describe('holdingEstablishment', () => {
    let findStub;
    let selectStub;
    let params;

    beforeEach(() => {
      findStub = sinon.stub();
      selectStub = sinon.stub();
      const stubModels = {
        PIL: {
          queryWithDeleted: sinon.stub().returns({
            findById: findStub.returns({
              select: selectStub
            })
          })
        },
        Project: {
          queryWithDeleted: sinon.stub().returns({
            findById: findStub.returns({
              select: selectStub
            })
          })
        },
        ProjectVersion: {
          queryWithDeleted: sinon.stub().returns({
            findById: findStub.returns({
              select: selectStub
            })
          })
        }
      };

      allowed = allowedHelper({ db: stubModels });

      params = {
        model: 'pil',
        permissions: ['holdingEstablishment:admin'],
        user: {
          establishments: [
            {
              id: 8201,
              role: 'admin'
            },
            {
              id: 8202,
              role: 'basic'
            }
          ]
        }
      };
    });

    it('checks roles at PIL holding establishment', () => {
      selectStub.resolves({ establishmentId: 8201 });
      params.subject = { pilId: 123 };

      return Promise.resolve()
        .then(() => allowed(params))
        .then(isAllowed => {
          assert.ok(findStub.calledWith(123), 'PIL was looked up by provided ID');
          assert.equal(isAllowed, true, 'Permission check passed');
        });
    });

    it('uses `id` param if `pilId` is not defined', () => {
      selectStub.resolves({ establishmentId: 8201 });
      params.subject = { id: 123 };

      return Promise.resolve()
        .then(() => allowed(params))
        .then(isAllowed => {
          assert.ok(findStub.calledWith(123), 'PIL was looked up by provided ID');
          assert.equal(isAllowed, true, 'Permission check passed');
        });
    });

    it('fails if `pilId` and `id` are not defined', () => {
      selectStub.resolves({ establishmentId: 8201 });
      params.subject = {};

      return Promise.resolve()
        .then(() => allowed(params))
        .then(isAllowed => {
          assert.equal(isAllowed, false, 'Permission check failed');
        });
    });

    it('fails if no database record can be found', () => {
      selectStub.resolves();
      params.subject = { pilId: 123 };

      return Promise.resolve()
        .then(() => allowed(params))
        .then(isAllowed => {
          assert.ok(findStub.calledWith(123), 'PIL was looked up by provided ID');
          assert.equal(isAllowed, false, 'Permission check failed');
        });
    });

    it('fails if user does not have permission at PIL holding establishment', () => {
      selectStub.resolves({ establishmentId: 8202 });
      params.subject = { pilId: 123 };

      return Promise.resolve()
        .then(() => allowed(params))
        .then(isAllowed => {
          assert.ok(findStub.calledWith(123), 'PIL was looked up by provided ID');
          assert.equal(isAllowed, false, 'Permission check failed');
        });
    });

    it('checks roles at project holding establishment', () => {
      selectStub.resolves({ establishmentId: 8201 });
      params.model = 'project';
      params.subject = { projectId: 'abc' };

      return Promise.resolve()
        .then(() => allowed(params))
        .then(isAllowed => {
          assert.ok(findStub.calledWith('abc'), 'Project was looked up by provided ID');
          assert.equal(isAllowed, true, 'Permission check passed');
        });
    });

    it('fails if user does not have permission at project holding establishment', () => {
      selectStub.resolves({ establishmentId: 8202 });
      params.model = 'project';
      params.subject = { projectId: 'abc' };

      return Promise.resolve()
        .then(() => allowed(params))
        .then(isAllowed => {
          assert.ok(findStub.calledWith('abc'), 'Project was looked up by provided ID');
          assert.equal(isAllowed, false, 'Permission check failed');
        });
    });

    it('checks roles at project version holding establishment', () => {
      selectStub.resolves({ establishmentId: 8201 });
      params.model = 'projectVersion';
      params.subject = { projectId: 'abc' };

      return Promise.resolve()
        .then(() => allowed(params))
        .then(isAllowed => {
          assert.ok(findStub.calledWith('abc'), 'Project was looked up by provided ID');
          assert.equal(isAllowed, true, 'Permission check passed');
        });
    });

    it('fails if user does not have permission at project version holding establishment', () => {
      selectStub.resolves({ establishmentId: 8202 });
      params.model = 'projectVersion';
      params.subject = { projectId: 'abc' };

      return Promise.resolve()
        .then(() => allowed(params))
        .then(isAllowed => {
          assert.ok(findStub.calledWith('abc'), 'Project was looked up by provided ID');
          assert.equal(isAllowed, false, 'Permission check failed');
        });
    });
  });

  describe('receivingEstablishment', () => {
    let findStub;
    let selectStub;
    let params;

    beforeEach(() => {
      findStub = sinon.stub();
      selectStub = sinon.stub();
      const stubModels = {
        ProjectVersion: {
          queryWithDeleted: sinon.stub().returns({
            findById: findStub.returns({
              select: selectStub
            })
          })
        }
      };

      allowed = allowedHelper({ db: stubModels });

      params = {
        model: 'projectVersion',
        permissions: ['receivingEstablishment:admin'],
        user: {
          establishments: [
            {
              id: 8202,
              role: 'admin'
            }
          ]
        }
      };
    });

    it('checks roles at project holding establishment', () => {
      selectStub.resolves({ transferToEstablishment: 8202 });
      params.model = 'projectVersion';
      params.subject = { versionId: 'abc' };

      return Promise.resolve()
        .then(() => allowed(params))
        .then(isAllowed => {
          assert.ok(findStub.calledWith('abc'), 'ProjectVersion was looked up by provided ID');
          assert.equal(isAllowed, true, 'Permission check passed');
        });
    });

    it('fails if user does not have permission at project holding establishment', () => {
      selectStub.resolves({ data: { transferToEstablishment: 8201 } });
      params.model = 'projectVersion';
      params.subject = { versionId: 'abc' };

      return Promise.resolve()
        .then(() => allowed(params))
        .then(isAllowed => {
          assert.ok(findStub.calledWith('abc'), 'ProjectVersion was looked up by provided ID');
          assert.equal(isAllowed, false, 'Permission check failed');
        });
    });
  });

});
