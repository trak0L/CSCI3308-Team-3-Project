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

import db from '../db.js';

export async function createPost({ board_id, user_id, title }) {
    const { rows } = await db.query(
      `INSERT INTO posts (board_id, user_id, title)
       VALUES ($1, $2, $3)
       RETURNING post_id, board_id, user_id, title, created_at`,
      [board_id, user_id, title]
    );
    return rows[0];
  }