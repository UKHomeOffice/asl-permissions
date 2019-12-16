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

  describe('holdingEstablishment', () => {
    let findStub;
    let selectStub;
    let params;

    beforeEach(() => {
      findStub = sinon.stub();
      selectStub = sinon.stub();
      const stubModels = {
        PIL: {
          query: sinon.stub().returns({
            findById: findStub.returns({
              select: selectStub
            })
          })
        },
        Project: {
          query: sinon.stub().returns({
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
  });

});
