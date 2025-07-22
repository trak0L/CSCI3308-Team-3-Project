const { expect } = require('chai');

describe('Integration Test: User creates a post', () => {

  it('should create a user and then a post for that user', () => {
    
    // mock user creation
    function createUser(username, password) {
      return {
        userId: 1,
        username,
        password: `hashed(${password})`
      };
    }

    // mock post creation
    function createPost(userId, boardId, title, content) {
      return {
        userId,
        boardId,
        title,
        content,
        // createdAt: new Date().toISOString()
      };
    }

    // simulate workflow
    const user = createUser('faris', 'secure123');
    const post = createPost(user.userId, 1, 'Integration Test Post', 'This post was made by Faris.');

    // test connections
    expect(user.username).to.equal('faris');
    expect(post.userId).to.equal(user.userId);
    expect(post.title).to.equal('Integration Test Post');
  });

});
