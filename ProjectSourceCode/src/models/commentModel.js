/** commentModel.js
 *
 *  this file handles all interactions with the `comments` table, like:
 *   - inserting a new comment under a given post by a user
 *   - fetching all comments for a post (with author username via JOIN)
 *   - updating comment text (if added)
 *   - deleting comments (if added)
 *
 *  exports functions like:
 *   addComment({ post_id, user_id, body })
 *   getCommentsByPost(postId)
 *   getCommentById(commentId)
 */

import db from '../db.js';

export async function addComment({ post_id, user_id, body }) {
  const { rows } = await db.query(
    `INSERT INTO comments (post_id, user_id, body)
     VALUES ($1, $2, $3)
     RETURNING comment_id, post_id, user_id, body, created_at`,
    [post_id, user_id, body]
  );
  return rows[0];
}