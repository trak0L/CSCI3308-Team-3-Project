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

// TODO - Include your API routes here

// -------------------------------------  ROUTES for landing page   ----------------------------------------------



app.get('/', (req, res) => {
  const logged = req.session && req.session.user;
  res.render('pages/home', { logged });
});


// -------------------------------------  ROUTES for home page   ----------------------------------------------

// Initializers
const user = {
  password: undefined,
  username: undefined,
  user_id: undefined,
  email: undefined,
  permission: undefined,
};

const boards = `
  SELECT
  *    
  FROM
  boards
  ORDER BY board_id DESC;`;

app.get('/home', (req, res) => {

  db.any(boards)
    .then(boards => {
      console.log(boards);
      res.render('pages/home', {
        boards
      }); 
    })
    .catch(err => {
      res.render('pages/home', {
        boards: [],
        error: true,
        message: err.message,
      });
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

const board_posts = `
  SELECT
  *    
  FROM
  posts
  WHERE
  board_id = $1
  ORDER BY post_id DESC;`;

app.get('/board', (req, res) => {
  const board_id = req.query.board_id;
  db.one('SELECT name, description FROM boards WHERE board_id = $1 LIMIT 1;', [board_id]).then(board=>{
  db.any(board_posts, [board_id])
    .then(posts =>{
      console.log(posts);
      res.render('pages/board', {
        title: board.name,
        description: board.description,
        posts
      });
    })
    .catch(err => {
      res.render('pages/board', {
        posts: [],
        error: true,
        message: err.message,
      });
    });
  });
});

app.post('/board', async (req,res) =>{
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

// -------------------------------------  ROUTES for threads page   ----------------------------------------------

const thread_comments = `
  SELECT
  *    
  FROM
  comments
  WHERE
  post_id = $1
  ORDER BY comment_id DESC;`;

app.get('/thread', (req, res) => {
  const post_id = req.query.thread_id;
  db.one('SELECT title FROM posts WHERE post_id = $1 LIMIT 1;', [post_id]).then(post=>{
  db.any(thread_comments, [post_id])
    .then(comments =>{
      console.log(comments);
      res.render('pages/thread', {
        title: post.title,
        comments
      });
    })
    .catch(err => {
      res.render('pages/thread', {
        posts: [],
        error: true,
        message: err.message,
      });
    });
  });
});

app.post('/board', async (req,res) =>{
  try {
  const {post_title, user_id, board_id} = req.body;
  const query = `
  INSERT INTO threads 
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

// -------------------------------------  START THE SERVER   ----------------------------------------------

app.listen(3000);
console.log('Server is listening on port 3000');