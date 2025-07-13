/** userModel.js
 *
 *  this file is responsible for all database operations on the `users` table, like:
 *   - creating new users (with hashed passwords and default roles)
 *   - looking up users by email or ID (if we add something like this)
 *   - updating user profiles or deleting users (if we add something like this)
 *
 *  exports functions like:
 *   createUser({ username, email, password_hash })
 *   findUserByEmail(email)
 *   findUserById(id)
 */

import db from '../db.js';

export async function createUser({ username, email, password_hash }) {
  const { rows } = await db.query(
    `INSERT INTO users (username, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING user_id, username, email, privilege, created_at`,
    [username, email, password_hash]
  );
  return rows[0];
}
