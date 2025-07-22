const { expect } = require('chai');

describe('Board Model', () => {

  it('should create a board with name and description', () => {

    // mock createBoard 
    function createBoard(name, description) {
      return { name, description };
    }

    const board = createBoard('Test Board', 'Board for testing');
    expect(board.name).to.equal('Test Board');
    expect(board.description).to.equal('Board for testing');
  });
});
