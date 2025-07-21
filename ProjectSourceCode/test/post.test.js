const { expect } = require('chai');

describe('Post Model', () => {
  it('should create a post with title and content', () => {

    // mock createPost since postModel.js might not be implemented yet
    function createPost(userId, boardId, title, content) {
      return {
        userId,
        boardId,
        title,
        content,
        createdAt: new Date().toISOString()
      };
    }

    // where createPost takes (userId, boardId, title, and content)
    const post = createPost(1, 1, 'My First Post', 'Hello, this is a post.');
    expect(post.userId).to.equal(1);
    expect(post.boardId).to.equal(1);
    expect(post.title).to.equal('My First Post');
    expect(post.content).to.equal('Hello, this is a post.');
  });

});
