/* TODO:
- Need landing page
- Need to work on nav bar to have login/register
- Need to have main posts page
  - This will need the auth middleware
    // Authentication Middleware.
    const auth = (req, res, next) => {
      if (!req.session.user) {
        // Default to login page.
        return res.redirect('/login');
      }
      next();
    };

    // Authentication Required
    app.use(auth);

*/

// ----------------------------------   DEPENDENCIES  ----------------------------------------------
const express = require('express');
const bcrypt = require('bcryptjs'); //  To hash passwords
const app = express();
const handlebars = require('express-handlebars');
const Handlebars = require('handlebars');
const path = require('path');
const pgp = require('pg-promise')();
const bodyParser = require('body-parser');
const session = require('express-session');
const { permission } = require('process');

// -------------------------------------  APP CONFIG   ----------------------------------------------

// create `ExpressHandlebars` instance and configure the layouts and partials dir.
const hbs = handlebars.create({
  extname: 'hbs',
  layoutsDir: __dirname + '/views/layouts',
  partialsDir: __dirname + '/views/partials',
});

// Register `hbs` as our view engine using its bound `engine()` function.
app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.json());
// set Session
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: true,
    resave: true,
  })
);
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

// -------------------------------------  DB CONFIG AND CONNECT   ---------------------------------------
const dbConfig = {
  host: 'db',
  port: 5432,
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
};
const db = pgp(dbConfig);

// db test
db.connect()
  .then(obj => {
    // Can check the server version here (pg-promise v10.1.0+):
    console.log('Database connection successful');
    obj.done(); // success, release the connection;
  })
  .catch(error => {
    console.log('ERROR', error.message || error);
  });

// -------------------------------------  ROUTES for landing page   ----------------------------------------------

app.get('/', (req, res) => {
  res.redirect('/login');
});

// -------------------------------------  ROUTES for home page   ----------------------------------------------

app.get('/home', (req, res) => {
  const logged = req.session && req.session.user;

  if (!logged) return res.redirect('/login');

  res.render('pages/home', {
    username: req.session.user.username,
    logged
  });
});

// -------------------------------------  ROUTES for register.hbs   ----------------------------------------------

// Load the register page
app.get('/register', (req, res) => {
  res.render('pages/register');  
});

// Take the user input and add it as a user
app.post('/register', async (req, res) => {
  console.log('[DEBUG] Register hit:', req.body);
  // Take the information and check if the passwords are the same
  const { username, email, password, confirmPassword } = req.body;
  if (password !== confirmPassword) {
    return res.status(400).render('pages/register', {
      message: 'Passwords do not match'
    });
  }

  try {
    // Take the import to compare
    const exists = await db.any(
      'SELECT * FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    // Check if user already exists
    if (exists.length > 0) {
      return res.status(400).render('pages/register', {
        message: 'Username/Email already exists'
      });
    }

    // Wait to hash the password 
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert into DB if not in DB
    const query = `
      INSERT INTO users (username, email, password_hash)
      VALUES ($1, $2, $3)
      RETURNING *`;
    const newUser = await db.one(query, [username, email, hashedPassword]);
    
    // Send user to login
    // TODO: Add a message to prompt user to login with new credentials
    res.redirect('/login');
  } catch (err) {
    console.error('Registration failed:', err.message);
    return res.status(500).render('pages/register', {
      message: 'An unexpected error occurred'
    });
  }
});

// -------------------------------------  ROUTES for login.hbs   ----------------------------------------------

// Initializers
const user = {
  password: undefined,
  username: undefined,
};

// Load page
app.get('/login', (req, res) => {
  res.render('pages/login');
});

// Login submission
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const query = 'SELECT * FROM users WHERE username = $1 LIMIT 1';

  // Check for correct info then redirect to correct page
  db.one(query, [username])
    .then(user => {
      return bcrypt.compare(password, user.password_hash)
        .then(match => {
          if (!match) throw new Error('Invalid password');

          req.session.user = user;
          req.session.save();
          res.redirect('/home');
        });
    })
    .catch(err => {
      console.error('Login failed:', err.message);
      res.status(401).render('pages/login', {
        message: 'Login failed: ' + err.message
      });
    });
});



// -------------------------------------  ROUTES for logout.hbs   ----------------------------------------------

app.get('/logout', (req, res) => {
  req.session.destroy(function(err) {
    res.render('pages/logout');
  });
});

// -------------------------------------  ROUTES for boards page   ----------------------------------------------

app.get('/board', async (req, res) => {
  const board_id = req.query.board_id;

  // the user should be logged in to view boards or posts
  const logged = req.session && req.session.user;
  if (!logged) return res.redirect('/login');

  if (!board_id) {
    try {
      const boards = await db.any('SELECT * FROM boards ORDER BY board_id');
      return res.render('pages/board', {
        boards,
        showList: true,
        logged
      });
    } catch (err) {
      return res.status(500).render('pages/board', {
        boards: [],
        error: true,
        message: 'Failed to load boards: ' + err.message,
        showList: true,
        logged
      });
    }
  }

  try {
    const board = await db.oneOrNone('SELECT name, description FROM boards WHERE board_id = $1 LIMIT 1;', [board_id]);
    if (!board) {
      return res.status(404).render('pages/board', {
        posts: [],
        error: true,
        message: 'Board not found',
        showList: false,
        logged
      });
    }

    const posts = await db.any('SELECT * FROM posts WHERE board_id = $1 ORDER BY post_id DESC;', [board_id]);
    return res.render('pages/board', {
      title: board.name,
      description: board.description,
      board_id,
      posts,
      showList: false,
      logged
    });
  } catch (err) {
    return res.status(500).render('pages/board', {
      posts: [],
      error: true,
      message: 'Unexpected error: ' + err.message,
      showList: false,
      logged
    });
  }
});




app.post('/board', async (req,res) =>{
  // the user should be logged to do anything
  const logged = req.session && req.session.user;
  if (!logged) return res.redirect('/login');

  try {
    const {board_name, board_description} = req.body;
    const query = `
      INSERT INTO boards 
      (name, description) 
      VALUES ($1, $2) RETURNING *;`;
    
    const newBoard = await db.one(query, [board_name, board_description]);
    res.redirect('/home');}
  catch (err) {
    console.error('Board Cation failed:', err.message);
    return res.status(500).render('pages/home', {
      message: 'An unexpected error occurred'
    });
  }
});

// -------------------------------------  ROUTES for posts page   ----------------------------------------------

const post_comments = `
  SELECT
  *    
  FROM
  comments
  WHERE
  post_id = $1
  ORDER BY comment_id DESC;`;

  

app.get('/posts', (req, res) => {
  // the user should be logged to do anything
  const logged = req.session && req.session.user;
  if (!logged) return res.redirect('/login');

  const post_id = req.query.post_id;
  db.one('SELECT title FROM posts WHERE post_id = $1 LIMIT 1;', [post_id]).then(post=>{
  db.any(post_comments, [post_id])
    .then(comments =>{
      console.log(comments);
      res.render('pages/posts', {
        title: post.title,
        comments
      });
    })
    .catch(err => {
      res.render('pages/posts', {
        posts: [],
        error: true,
        message: err.message,
      });
    });
  });
});

app.post('/board', async (req,res) =>{
  // the user should be logged to do anything
  const logged = req.session && req.session.user;
  if (!logged) return res.redirect('/login');

  try {
  const {post_title, user_id, board_id} = req.body;
  const query = `
  INSERT INTO posts 
  (board_id, user_id, post_title) 
  VALUES ($1, $2, $3) RETURNING *;`;
  const newBoard = await db.one(query, [board_id, user_id, post_title]);
  res.redirect('/home');}
  catch (err) {
    console.error('Board Cation failed:', err.message);
    return res.status(500).render('pages/home', {
      message: 'An unexpected error occurred'
    });
  }
});

app.post('/post/create', async (req, res) => {
  // the user should be logged to do anything
  const logged = req.session && req.session.user;
  if (!logged) return res.redirect('/login');

  const { board_id, title, body } = req.body;
  const user_id = user.user_id;

  if (!title || !board_id) {
    return res.status(400).render('pages/posts', {
      error: true,
      message: 'Post title and board are required.',
      showForm: true,
      board_id
    });
  }

  try {
    const query = `
      INSERT INTO posts (board_id, user_id, title, body)
      VALUES ($1, $2, $3, $4) RETURNING *;
    `;
    const newPost = await db.one(query, [board_id, user_id, title, body]);
    res.redirect(`/board?board_id=${board_id}`);
  } catch (err) {
    console.error('Post creation failed:', err.message);
    return res.status(500).render('pages/posts', {
      error: true,
      message: 'An unexpected error occurred: ' + err.message,
      showForm: true,
      board_id
    });
  }
});


// -------------------------------------  START THE SERVER   ----------------------------------------------

app.listen(3000);
console.log('Server is listening on port 3000');