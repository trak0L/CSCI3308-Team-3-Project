/* 
design note:

  a board is a category or “forum section” e.g. “code problems”

  a post is the conversation you start in that board, so the inital post, e.g. “why won’t my code compile?”

  a comment is one message inside a post e.g. “did you cmd-s save the file before trying to complie?…”


 core tables for the message‑board data:
   • users – accounts with hashed passwords, roles, timestamps  
   • boards – top‑level categories  
   • posts – discussion topics tied to a board & author  
   • comments – replies tied to a post & author  
   • comment_likes – upvotes (composite PK of user_id+comment_id)  
   • images + comment_images – (optional) attach images to comments 

-> boards, posts, and comments are all linked togther by foreign keys

*/


-- users
CREATE TABLE users (
  user_id       SERIAL PRIMARY KEY,           -- SERIAL: auto‑incrementing integer type so ids dont have to be managed manually
  username      VARCHAR(100) NOT NULL UNIQUE, -- NOT NULL: every user must have a username/UNIQUE: no users can have same username
  email         VARCHAR(100) NOT NULL UNIQUE, -- every user must have email/no emails can be the same
  password_hash VARCHAR(128) NOT NULL,        -- user must have passwordhash
  icon_url      TEXT DEFAULT 'https://wallpapers.com/images/hd/generic-person-icon-profile-ulmsmhnz0kqafcqn-2.jpg',
  privilege     VARCHAR(50)  NOT NULL DEFAULT 'user', -- DEFAULT new accounts automatically start with standard “user” role
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()    -- automate account creation time stamp
);

-- boards
CREATE TABLE boards (
  board_id    SERIAL PRIMARY KEY,  -- auto incrementing integer primary key
  name        VARCHAR(100) NOT NULL, -- every board must have a name/no nameless boards floating around the aether 
  description TEXT
);

-- posts
CREATE TABLE posts (
  post_id     SERIAL PRIMARY KEY,
  board_id    INT NOT NULL REFERENCES boards(board_id) ON DELETE CASCADE, -- INT NOT NULL: every thread must belong to a board, can’t be empty/REFERENCES boards(board_id): establish a foreign‑key link to the boards table, you can only create threads for boards that actually exist/ON DELETE CASCADE: if someone deletes a board, all its threads are automatically removed-prevents threads pointing at a nonexistent board
  user_id     INT NOT NULL REFERENCES users(user_id)  ON DELETE CASCADE,  -- INT NOT NULL: every thread has an author/REFERENCES users(user_id): links to the users table so you know which user created the thread/ON DELETE CASCADE: if a user is deleted all threads they created are also deleted
  title       VARCHAR(200) NOT NULL,                                      -- subject of the discussion
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- comments
CREATE TABLE comments (
  comment_id  SERIAL PRIMARY KEY,
  post_id     INT NOT NULL REFERENCES posts(post_id) ON DELETE CASCADE, -- associates the comment with its parent post; cascades so deleting a post removes its comments
  user_id     INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE, -- tracks who wrote the comment
  body        TEXT NOT NULL,                                            -- comment’s content
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()                        -- when the comment was made
);

-- comment likes (optional if we get all the core functionailty done)
CREATE TABLE post_likes (
  user_id INT REFERENCES users(user_id)  ON DELETE CASCADE,
  post_id INT REFERENCES posts(post_id)  ON DELETE CASCADE,
  PRIMARY KEY(user_id, post_id)
);

-- images
CREATE TABLE images (
  image_id   SERIAL PRIMARY KEY,
  image_url  VARCHAR(255) NOT NULL
);

CREATE TABLE post_images (
  post_id   INT REFERENCES posts(post_id)   ON DELETE CASCADE,
  image_id  INT REFERENCES images(image_id) ON DELETE CASCADE,
  PRIMARY KEY(post_id, image_id)
);

CREATE TABLE comment_images (
  comment_id INT REFERENCES comments(comment_id) ON DELETE CASCADE,
  image_id   INT REFERENCES images(image_id)    ON DELETE CASCADE,
  PRIMARY KEY(comment_id, image_id)
);
