/** boardModel.js
 *
 *  this file is responsible for all queries against the `boards` table, providing functions to:
 *   - create a new board/category
 *   - fetch all boards or a single board by ID
 *   - update board details (name/description) (if added)
 *   - delete a board (cascading threads/posts) (if added)
 *
 *  exports functions like:
 *   getAllBoards()
 *   getBoardById(boardId)
 *   createBoard({ name, description })
 */
