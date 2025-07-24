const { expect } = require('chai');
const { createUser } = require('../src/models/userModel.js');
const { createBoard } = require('../src/models/boardModel.js');
const { createPost } = require('../src/models/postModel.js');
const db = require('../src/db.js');

describe('Integration Test: User creates a post on a board', function () {
  this.timeout(10000);

  let testUser, testBoard, testPost;

  it('should create a user, board, and a post connecting them', async () => {

    // Step 1: Create user
    testUser = await createUser({
      username: 'integration_user',
      email: 'integration_user@example.com',
      password_hash: 'integration_hash'
    });

    // Step 2: Create board
    testBoard = await createBoard({
      name: 'Integration Test Board',
      description: 'Board created for integration test'
    });

    // Step 3: Create post
    testPost = await createPost({
      user_id: testUser.user_id,
      board_id: testBoard.board_id,
      title: 'Integration Test Post'
    });

    // Step 4: Validate relationships
    expect(testPost).to.have.property('post_id');
    expect(testPost.user_id).to.equal(testUser.user_id);
    expect(testPost.board_id).to.equal(testBoard.board_id);
    expect(testPost.title).to.equal('Integration Test Post');

  });

  after(async () => {
    if (testPost) {
      await db.query('DELETE FROM posts WHERE post_id = $1', [testPost.post_id]);
    }
    if (testBoard) {
      await db.query('DELETE FROM boards WHERE board_id = $1', [testBoard.board_id]);
    }
    if (testUser) {
      await db.query('DELETE FROM users WHERE user_id = $1', [testUser.user_id]);
    }
  });
  
});
