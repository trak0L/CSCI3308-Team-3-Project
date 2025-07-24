const { expect } = require('chai');
const { createBoard } = require('../src/models/boardModel.js');
const db = require('../src/db.js');

describe('Board Model', function () {

  // Set higher timeout (10 seconds)
  this.timeout(10000); 

  let createdBoardId;

  it('should create a board with name and description', async () => {
    const newBoard = await createBoard({
      name: 'Test Board',
      description: 'Board for testing'
    });

    expect(newBoard).to.have.property('board_id');
    expect(newBoard.name).to.equal('Test Board');
    expect(newBoard.description).to.equal('Board for testing');

    // Save board_id for cleanup
    createdBoardId = newBoard.board_id;

  });

  after(async () => {

    if (createdBoardId) {
      await db.query('DELETE FROM boards WHERE board_id = $1', [createdBoardId]);
    }
    
  });
});
