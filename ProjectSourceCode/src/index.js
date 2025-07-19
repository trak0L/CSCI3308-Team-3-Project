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

          req.session.user = user; // save the specific sestion
          req.session.save(); // create a recognizable session
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

// destroy the login session
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

  // If there is no board ID request
  if (!board_id) {
    // try to load all the boards that available
    try {
      const boards = await db.any('SELECT * FROM boards ORDER BY board_id'); // pull the boards on DB
      return res.render('pages/board', {
        boards,
        showList: true,
        logged // nessesary for nav.hbs to load correct info
      });
    } catch (err) { // if there are none then just load the error message
      return res.status(500).render('pages/board', {
        boards: [],
        error: true,
        message: 'Failed to load boards: ' + err.message,
        showList: true,
        logged
      });
    }
  }

  // Loading the specific board as an extention of /board
  try {
    // Pull the board_id
    const board = await db.oneOrNone('SELECT name, description FROM boards WHERE board_id = $1 LIMIT 1;', [board_id]);

    // No board then give feedback
    if (!board) {
      return res.status(404).render('pages/board', {
        posts: [],
        error: true,
        message: 'Board not found',
        showList: false,
        logged
      });
    }

    // if there is board load more of them
    const posts = await db.any('SELECT * FROM posts WHERE board_id = $1 ORDER BY post_id DESC;', [board_id]);
    
    // print out rest of the board information
    return res.render('pages/board', {
      title: board.name,
      description: board.description,
      board_id,
      posts,
      showList: false,
      logged
    });
  } catch (err) { // Catch unforseen errors
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

  try { // try to post a board with 
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

// -------------------------------------  ROUTES for Board Create page   ----------------------------------------------

// Load the board_create
app.get('/board_create', (req, res) => {
  const logged = req.session && req.session.user;
  if (!logged) return res.redirect('/login');
  res.render('pages/board_create');
});

// Adding to boards DB
app.post('/board_create', async (req, res) => {
  const logged = req.session && req.session.user;
  if (!logged) return res.redirect('/login');

  // From the form get the info and insert
  try {
    const { board_name, board_description } = req.body;
    const query = `
      INSERT INTO boards (name, description)
      VALUES ($1, $2) RETURNING *;
    `;
    await db.one(query, [board_name, board_description]);
    // if it adds correct then should bring to homepage
    // TODO: maybe could redirect to that new board 
    // so you can make a post on there
    res.redirect('/board'); 
  } catch (err) {
    console.error('Board creation failed:', err.message);
    res.status(500).render('pages/board_create', {
      message: 'An error occurred: ' + err.message
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

  // for the post ID load the comments for that post
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

// Load the create post for the right board_id
app.get('/post_create', (req, res) => {
  const logged = req.session && req.session.user;
  if (!logged) return res.redirect('/login');

  const board_id = req.query.board_id;
  res.render('pages/post_create', { board_id }); 
});

// Uploading the post to DB
app.post('/posts_create', async (req, res) => {
  const logged = req.session && req.session.user;
  if (!logged) return res.redirect('/login');

  try { // Try to make the post with given info
    const user_id = req.session.user.user_id;
    const { board_id, title, description } = req.body;

    const query = `
      INSERT INTO posts (board_id, user_id, title, created_at)
      VALUES ($1, $2, $3, DEFAULT)
      RETURNING post_id;
    `;

    await db.one(query, [board_id, user_id, title]);
    // redirect to the board the post exists on
    res.redirect(`/board?board_id=${board_id}`); 

  } catch (err) { // catch any errors
    console.error('Post creation failed:', err.message);
    res.status(500).render('pages/post_create', {
      board_id,
      message: 'An error occurred: ' + err.message
    });
  }
});



// -------------------------------------  START THE SERVER   ----------------------------------------------

app.listen(3000);
console.log('Server is listening on port 3000');