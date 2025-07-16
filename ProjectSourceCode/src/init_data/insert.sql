-- 1) seed boards
INSERT INTO boards (name, description) VALUES
  ('general', 'general discussion board'),
  ('help',    'post questions and get help'),
  ('off-topic','anything goes here')
;

-- 2) seed a test user
--   replace the password_hash with a real bcrypt hash generated separately
INSERT INTO users (username, email, password_hash, privilege)
VALUES
  ('testuser', 'test@example.com', '$2b$10$…RealHash…', 'admin')
;

-- 3) seed a post
--   this creates the first discussion in board_id=1 by user_id=1
INSERT INTO posts (board_id, user_id, title)
VALUES
  (1, 1, 'welcome to the forum'),
  (2, 1, 'welcome to the forum'),
  (3, 1, 'welcome to the forum')
;

-- 4) seed a comment
--   this creates the first reply in post_id=1 by user_id=1
INSERT INTO comments (post_id, user_id, body)
VALUES
  (1, 1, 'this is the first comment; ntroduce yourself')
;
