const moment = require('moment');
const uuid = require('uuid/v4');
const assert = require('assert');
const sinon = require('sinon');
const allowedHelper = require('../lib/utils/allowed');
const db = require('./helpers/db');

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
          id: USER_ID,
          emailConfirmed: true
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

    it('does not throw an error if profile is not found', () => {
      selectStub.resolves(null);
      return Promise.resolve()
        .then(() => allowed(params))
        .then(isAllowed => {
          assert.equal(isAllowed, false);
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
          id: USER_ID,
          emailConfirmed: true
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
          id: USER_ID,
          emailConfirmed: true
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
          id: USER_ID,
          emailConfirmed: true
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
          ],
          emailConfirmed: true
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

  describe('project collaborator', () => {
    let selectStub;
    let profileSelectStub;

    beforeEach(() => {
      selectStub = sinon.stub();
      profileSelectStub = sinon.stub();
      const stubModels = {
        Project: {
          queryWithDeleted: sinon.stub().returns({
            whereIsCollaborator: sinon.stub().returns({
              withGraphFetched: sinon.stub().returns({
                findById: sinon.stub().returns({
                  select: selectStub
                })
              })
            })
          })
        },
        Profile: {
          query: sinon.stub().returns({
            findById: sinon.stub().returns({
              leftJoinRelated: sinon.stub().returns({
                withGraphFetched: sinon.stub().returns({
                  whereIn: sinon.stub().returns({
                    select: profileSelectStub
                  })
                })
              })
            })
          })
        }
      };
      allowed = allowedHelper({ db: stubModels });
    });

    it('returns true if the user is a collaborator', () => {
      const userId = uuid();
      selectStub.resolves({ id: '12345' });
      profileSelectStub.resolves({ id: '12345' });
      const params = {
        model: 'project',
        subject: {
          id: uuid()
        },
        permissions: ['project:collaborator'],
        user: {
          id: userId,
          emailConfirmed: true
        }
      };
      return Promise.resolve()
        .then(() => allowed(params))
        .then(isAllowed => {
          assert.equal(isAllowed, true);
        });
    });

    it('returns false if the user is not a collaborator', () => {
      const userId = uuid();
      selectStub.resolves(null);
      profileSelectStub.resolves(null);
      const params = {
        model: 'project',
        permissions: ['project:collaborator'],
        subject: {
          id: uuid()
        },
        user: {
          id: userId,
          emailConfirmed: true
        }
      };
      return Promise.resolve()
        .then(() => allowed(params))
        .then(isAllowed => {
          assert.equal(isAllowed, false);
        });
    });

    it('returns false if the user is not at the establishment', () => {
      const userId = uuid();
      selectStub.resolves({ id: '12345' });
      profileSelectStub.resolves(null);
      const params = {
        model: 'project',
        permissions: ['project:collaborator'],
        subject: {
          id: uuid()
        },
        user: {
          id: userId,
          emailConfirmed: true
        }
      };
      return Promise.resolve()
        .then(() => allowed(params))
        .then(isAllowed => {
          assert.equal(isAllowed, false);
        });
    });
  });

  describe('additional availability', () => {
    const ids = {
      profile: uuid(),
      basic: uuid(),
      licenceHolder: uuid(),
      activeProject: uuid(),
      draftProject: uuid(),
      latestGranted: uuid(),
      previousGranted: uuid(),
      latestDraft: uuid(),
      previousDraft: uuid()
    };

    before(() => {
      this.models = db.init();
      allowed = allowedHelper({ db: this.models });
    });

    after(() => {
      return this.models.destroy();
    });

    beforeEach(() => {

      return db.clean(this.models)
        .then(() => this.models.Establishment.query().insert([
          {
            id: 8201,
            name: 'University of Croydon'
          },
          {
            id: 8202,
            name: 'Marvell Pharmaceutical'
          }
        ]))
        .then(() => this.models.Profile.query().insert([
          {
            id: ids.licenceHolder,
            firstName: 'Bruce',
            lastName: 'Banner',
            email: 'bruce@banner.com'
          },
          {
            id: ids.profile,
            firstName: 'Sterling',
            lastName: 'Archer',
            email: 'sterling@archer.com'
          },
          {
            id: ids.basic,
            firstName: 'Basic',
            lastName: 'User',
            email: 'basic@user.com'
          }
        ]))
        .then(() => this.models.Project.query().insert([
          {
            id: ids.activeProject,
            status: 'active',
            establishmentId: 8201,
            licenceHolderId: ids.licenceHolder
          },
          {
            id: ids.draftProject,
            status: 'inactive',
            establishmentId: 8201,
            licenceHolderId: ids.licenceHolder
          }
        ]))
        .then(() => this.models.ProjectVersion.query().insert([
          {
            id: ids.latestGranted,
            status: 'granted',
            projectId: ids.activeProject,
            createdAt: moment().toISOString(),
            updatedAt: moment().toISOString()
          },
          {
            id: ids.previousGranted,
            status: 'granted',
            projectId: ids.activeProject,
            createdAt: moment().subtract(5, 'minutes').toISOString(),
            updatedAt: moment().subtract(5, 'minutes').toISOString()
          },
          {
            id: ids.latestDraft,
            status: 'draft',
            projectId: ids.draftProject,
            createdAt: moment().toISOString(),
            updatedAt: moment().toISOString()
          },
          {
            id: ids.previousDraft,
            status: 'draft',
            projectId: ids.draftProject,
            createdAt: moment().subtract(5, 'minutes').toISOString(),
            updatedAt: moment().subtract(5, 'minutes').toISOString()
          }
        ]))
        .then(() => this.models.Permission.query().insert([
          {
            establishmentId: 8201,
            profileId: ids.licenceHolder,
            role: 'basic'
          },
          {
            establishmentId: 8202,
            profileId: ids.profile,
            role: 'admin'
          },
          {
            establishmentId: 8202,
            profileId: ids.basic,
            role: 'basic'
          }
        ]).returning('*'))
        .then(() => this.models.ProjectEstablishment.query().insert([
          {
            projectId: ids.activeProject,
            establishmentId: 8202,
            status: 'active'
          },
          {
            projectId: ids.draftProject,
            establishmentId: 8202,
            status: 'draft'
          }
        ]));
    });

    describe('as admin user at additional establishment', () => {
      it('can view a project if has additional availability', () => {
        const params = {
          model: 'project',
          permissions: ['additionalEstablishment:admin'],
          subject: {
            projectId: ids.activeProject
          },
          user: {
            establishments: [
              {
                id: 8202,
                role: 'admin'
              }
            ],
            emailConfirmed: true
          }
        };

        return Promise.resolve()
          .then(() => allowed(params))
          .then(isAllowed => {
            assert.equal(isAllowed, true);
          });
      });

      it('cannot view a project if not admin', () => {
        const params = {
          model: 'project',
          permissions: ['additionalEstablishment:admin'],
          subject: {
            projectId: ids.activeProject
          },
          user: {
            establishments: [
              {
                id: 8202,
                role: 'basic'
              }
            ],
            emailConfirmed: true
          }
        };

        return Promise.resolve()
          .then(() => allowed(params))
          .then(isAllowed => {
            assert.equal(isAllowed, false);
          });
      });

      it('can view latest granted version if has active additional availability', () => {
        const params = {
          model: 'projectVersion',
          permissions: ['additionalEstablishment:admin'],
          subject: {
            versionId: ids.latestGranted,
            establishment: 8202,
            projectId: ids.activeProject
          },
          user: {
            establishments: [
              {
                id: 8202,
                role: 'admin'
              }
            ],
            emailConfirmed: true
          }
        };

        return Promise.resolve()
          .then(() => allowed(params))
          .then(isAllowed => {
            assert.equal(isAllowed, true);
          });
      });

      it('cannot view previous granted version if has active additional availability', () => {
        const params = {
          model: 'projectVersion',
          permissions: ['additionalEstablishment:admin'],
          subject: {
            versionId: ids.previousGranted,
            establishment: 8202,
            projectId: ids.activeProject
          },
          user: {
            establishments: [
              {
                id: 8202,
                role: 'admin'
              }
            ],
            emailConfirmed: true
          }
        };

        return Promise.resolve()
          .then(() => allowed(params))
          .then(isAllowed => {
            assert.equal(isAllowed, false);
          });
      });

      it('can view latest draft version if has draft additional availability for draft project', () => {
        const params = {
          model: 'projectVersion',
          permissions: ['additionalEstablishment:admin'],
          subject: {
            versionId: ids.latestDraft,
            establishment: 8202,
            projectId: ids.draftProject
          },
          user: {
            establishments: [
              {
                id: 8202,
                role: 'admin'
              }
            ],
            emailConfirmed: true
          }
        };

        return Promise.resolve()
          .then(() => allowed(params))
          .then(isAllowed => {
            assert.equal(isAllowed, true);
          });
      });

      it('cannot view previous draft version if has draft additional availability for draft project', () => {
        const params = {
          model: 'projectVersion',
          permissions: ['additionalEstablishment:admin'],
          subject: {
            versionId: ids.previousDraft,
            establishment: 8202,
            projectId: ids.draftProject
          },
          user: {
            establishments: [
              {
                id: 8202,
                role: 'admin'
              }
            ],
            emailConfirmed: true
          }
        };

        return Promise.resolve()
          .then(() => allowed(params))
          .then(isAllowed => {
            assert.equal(isAllowed, false);
          });
      });

      it('can view given granted version if has removed additional availability for granted project', () => {
        const params = {
          model: 'projectVersion',
          permissions: ['additionalEstablishment:admin'],
          subject: {
            versionId: ids.previousGranted,
            establishment: 8202,
            projectId: ids.activeProject
          },
          user: {
            establishments: [
              {
                id: 8202,
                role: 'admin'
              }
            ],
            emailConfirmed: true
          }
        };

        return Promise.resolve()
          .then(() => this.models.ProjectEstablishment.query().where({ projectId: ids.activeProject, establishmentId: 8202 }).patch({ status: 'removed', versionId: ids.previousGranted }))
          .then(() => allowed(params))
          .then(isAllowed => {
            assert.equal(isAllowed, true);
          });
      });

      it('cannot view latest granted version if has removed additional availability for granted project', () => {
        const params = {
          model: 'projectVersion',
          permissions: ['additionalEstablishment:admin'],
          subject: {
            versionId: ids.latestGranted,
            establishment: 8202,
            projectId: ids.activeProject
          },
          user: {
            establishments: [
              {
                id: 8202,
                role: 'admin'
              }
            ],
            emailConfirmed: true
          }
        };

        return Promise.resolve()
          .then(() => this.models.ProjectEstablishment.query().where({ projectId: ids.activeProject, establishmentId: 8202 }).patch({ status: 'removed', versionId: ids.previousGranted }))
          .then(() => allowed(params))
          .then(isAllowed => {
            assert.equal(isAllowed, false);
          });
      });
    });

    describe('as collaborator at additional establishment', () => {
      it('can view a project with additional availability', () => {
        const params = {
          model: 'project',
          permissions: ['project:collaborator'],
          subject: {
            projectId: ids.activeProject,
            establishment: 8202
          },
          user: {
            id: ids.basic,
            establishments: [
              {
                id: 8202,
                role: 'basic'
              }
            ],
            emailConfirmed: true
          }
        };

        return Promise.resolve()
          .then(() => this.models.ProjectProfile.query().insert({ profileId: ids.basic, projectId: ids.activeProject }))
          .then(() => allowed(params))
          .then(isAllowed => {
            assert.equal(isAllowed, true);
          });
      });

      it('cannot view a project with additional availability if not a collaborator', () => {
        const params = {
          model: 'project',
          permissions: ['project:collaborator'],
          subject: {
            projectId: ids.activeProject,
            establishment: 8202
          },
          user: {
            id: ids.basic,
            establishments: [
              {
                id: 8202,
                role: 'basic'
              }
            ],
            emailConfirmed: true
          }
        };

        return Promise.resolve()
          .then(() => allowed(params))
          .then(isAllowed => {
            assert.equal(isAllowed, false);
          });
      });

      it('can view a latest granted version of active project with active availability', () => {
        const params = {
          model: 'projectVersion',
          permissions: ['projectVersion:collaborator'],
          subject: {
            projectId: ids.activeProject,
            versionId: ids.latestGranted,
            establishment: 8202
          },
          user: {
            id: ids.basic,
            establishments: [
              {
                id: 8202,
                role: 'basic'
              }
            ],
            emailConfirmed: true
          }
        };

        return Promise.resolve()
          .then(() => this.models.ProjectProfile.query().insert({ profileId: ids.basic, projectId: ids.activeProject }))
          .then(() => allowed(params))
          .then(isAllowed => {
            assert.equal(isAllowed, true);
          });
      });

      it('cannot view a previous granted version of active project with active availability', () => {
        const params = {
          model: 'projectVersion',
          permissions: ['projectVersion:collaborator'],
          subject: {
            projectId: ids.activeProject,
            versionId: ids.previousGranted,
            establishment: 8202
          },
          user: {
            id: ids.basic,
            establishments: [
              {
                id: 8202,
                role: 'basic'
              }
            ],
            emailConfirmed: true
          }
        };

        return Promise.resolve()
          .then(() => this.models.ProjectProfile.query().insert({ profileId: ids.basic, projectId: ids.activeProject }))
          .then(() => allowed(params))
          .then(isAllowed => {
            assert.equal(isAllowed, false);
          });
      });

      it('can view a the latest version of draft project with draft availability', () => {
        const params = {
          model: 'projectVersion',
          permissions: ['projectVersion:collaborator'],
          subject: {
            projectId: ids.draftProject,
            versionId: ids.latestDraft,
            establishment: 8202
          },
          user: {
            id: ids.basic,
            establishments: [
              {
                id: 8202,
                role: 'basic'
              }
            ],
            emailConfirmed: true
          }
        };

        return Promise.resolve()
          .then(() => this.models.ProjectProfile.query().insert({ profileId: ids.basic, projectId: ids.draftProject }))
          .then(() => allowed(params))
          .then(isAllowed => {
            assert.equal(isAllowed, true);
          });
      });

      it('cannot view a previous version of draft project with draft availability', () => {
        const params = {
          model: 'projectVersion',
          permissions: ['projectVersion:collaborator'],
          subject: {
            projectId: ids.draftProject,
            versionId: ids.previousDraft,
            establishment: 8202
          },
          user: {
            id: ids.basic,
            establishments: [
              {
                id: 8202,
                role: 'basic'
              }
            ],
            emailConfirmed: true
          }
        };

        return Promise.resolve()
          .then(() => this.models.ProjectProfile.query().insert({ profileId: ids.basic, projectId: ids.draftProject }))
          .then(() => allowed(params))
          .then(isAllowed => {
            assert.equal(isAllowed, false);
          });
      });

      it('can view the specifed version of a project with removed availability', () => {
        const params = {
          model: 'projectVersion',
          permissions: ['projectVersion:collaborator'],
          subject: {
            projectId: ids.activeProject,
            versionId: ids.previousGranted,
            establishment: 8202
          },
          user: {
            id: ids.basic,
            establishments: [
              {
                id: 8202,
                role: 'basic'
              }
            ],
            emailConfirmed: true
          }
        };

        return Promise.resolve()
          .then(() => this.models.ProjectEstablishment.query().where({ establishmentId: 8202, projectId: ids.activeProject }).patch({ status: 'removed', versionId: ids.previousGranted }))
          .then(() => this.models.ProjectProfile.query().insert({ profileId: ids.basic, projectId: ids.activeProject }))
          .then(() => allowed(params))
          .then(isAllowed => {
            assert.equal(isAllowed, true);
          });
      });

      it('cannot view the latest version of a project with removed availability', () => {
        const params = {
          model: 'projectVersion',
          permissions: ['projectVersion:collaborator'],
          subject: {
            projectId: ids.activeProject,
            versionId: ids.latestGranted,
            establishment: 8202
          },
          user: {
            id: ids.basic,
            establishments: [
              {
                id: 8202,
                role: 'basic'
              }
            ],
            emailConfirmed: true
          }
        };

        return Promise.resolve()
          .then(() => this.models.ProjectEstablishment.query().where({ establishmentId: 8202, projectId: ids.activeProject }).patch({ status: 'removed', versionId: ids.previousGranted }))
          .then(() => this.models.ProjectProfile.query().insert({ profileId: ids.basic, projectId: ids.activeProject }))
          .then(() => allowed(params))
          .then(isAllowed => {
            assert.equal(isAllowed, false);
          });
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
          ],
          emailConfirmed: true
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

  describe('error handling', () => {

    let stub;
    let params;
    const USER_ID = '1efe4fe4-9c9a-4d89-af91-fc5eea0014f1';
    const PIL_ID = '29ece18a-afeb-4dc9-a02e-734e054a40c7';

    beforeEach(() => {
      stub = sinon.stub().rejects(new Error('Test'));

      const stubModels = {
        PIL: {
          queryWithDeleted: stub
        }
      };

      allowed = allowedHelper({ db: stubModels });

      params = {
        permissions: ['pil:own'],
        user: {
          id: USER_ID,
          emailConfirmed: true
        },
        subject: {
          pilId: PIL_ID
        },
        log: sinon.stub()
      };
    });

    it('returns false if a check throws an error', () => {
      return Promise.resolve()
        .then(() => allowed(params))
        .then(isAllowed => {
          assert.equal(isAllowed, false);
        });
    });

    it('returns logs the error', () => {
      return Promise.resolve()
        .then(() => allowed(params))
        .then(() => {
          assert.ok(params.log.calledWith('error'), 'error logger should have been called');
        });
    });

  });

});
