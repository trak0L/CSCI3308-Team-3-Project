const { expect } = require('chai');
const { createUser } = require('../src/models/userModel.js');
const { createBoard } = require('../src/models/boardModel.js');
const { createPost } = require('../src/models/postModel.js');
const db = require('../src/db.js');

describe('Post Model', function () {

  this.timeout(10000); // increase timeout for async DB

  let testUser, testBoard, testPost;

  before(async () => {

    // Create a test user
    testUser = await createUser({
      username: 'postuser',
      email: 'postuser@example.com',
      password_hash: 'hashedpassword123'
    });

    // Create a test board
    testBoard = await createBoard({
      name: 'Post Test Board',
      description: 'Board for post model test'
    });

  });

  it('should create a post with valid user and board9999', async () => {
    testPost = await createPost({
      board_id: testBoard.board_id,
      user_id: testUser.user_id,
      title: 'Test Post Title'
    });

    expect(testPost).to.have.property('post_id');
    expect(testPost.board_id).to.equal(testBoard.board_id);
    expect(testPost.user_id).to.equal(testUser.user_id);
    expect(testPost.title).to.equal('Test Post Title');
    expect(new Date(testPost.created_at)).to.be.a('date');

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
