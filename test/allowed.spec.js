const assert = require('assert');

const allowed = require('../lib/utils/allowed');

describe('allowed', () => {

  it('returns false for profile scoped tasks if no profile is provided', () => {
    const isAllowed = allowed({
      roles: ['profile.own'],
      user: {
        id: 'abc123'
      }
    });
    assert.equal(isAllowed, false);
  });

});
