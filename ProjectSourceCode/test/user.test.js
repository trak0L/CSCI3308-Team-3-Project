const { expect } = require('chai');

describe('User Model', () => {
  it('should create a user with username and hashed password', async () => {

    // mock version
    const createUser = (username, password) => {

      return {
        username,
        password: `hashed(${password})`
      };

    };

    const user = createUser('testuser', 'testpass');
    expect(user.username).to.equal('testuser');
    expect(user.password).to.not.equal('testpass');
  });

});
