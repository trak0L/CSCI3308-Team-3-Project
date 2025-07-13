/** postModel.js
 *
 *  this file manages the `posts` table (formerly “threads”), like:
 *   - inserting new posts into a board by a user
 *   - retrieving posts by board ID (with optional joins to fetch author info)
 *   - updating post titles or content (if added)
 *   - deleting posts (cascading comments) (if added)
 *
 *  exports functions like:
 *   createPost({ board_id, user_id, title })
 *   getPostsByBoard(boardId)
 *   getPostById(postId)
 */
