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

// -------------------------------------  ROUTES for home.hbs   ----------------------------------------------

app.get('/', (req, res) => {
  res.render('pages/home', {
    
  });
});

// -------------------------------------  ROUTES for register.hbs   ----------------------------------------------

// Load the register page
app.get('/register', (req, res) => {
  res.render('pages/register');  
});

// take what the user is inputing
app.post('/register', async (req, res) => {
  const { username, password } = req.body; // take in the input

  try {
    // Check if user already exists
    const exists = await db.any('SELECT * FROM users WHERE username = $1', [username]);
    if (exists.length > 0) {
      return res.status(400).render('pages/register', {
        message: 'Username already exists'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const query = `
      INSERT INTO users (username, password_hash)
      VALUES ($1, $2)
      RETURNING *`;
    const newUser = await db.one(query, [username, hashedPassword]);

    res.redirect('/login');
  } catch (err) {
    console.error('Registration failed:', err.message);
    return res.status(500).render('pages/register', {
      message: 'An unexpected error occurred'
    });
  }
});


// -------------------------------------  ROUTES for login.hbs   ----------------------------------------------
const user = {
  password: undefined,
  username: undefined,
};

app.get('/login', (req, res) => {
  res.render('pages/login');
});

// Login submission
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const query = 'SELECT * FROM users WHERE username = $1 LIMIT 1';

  // Check the db for the username and password
  db.one(query, [username])
    .then(user => {
      return bcrypt.compare(password, user.password)
        .then(match => {
          if (!match) throw new Error('Invalid password');

          req.session.user = user;
          req.session.save();
          res.redirect('/discover');
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

// -------------------------------------  START THE SERVER   ----------------------------------------------

app.listen(3000);
console.log('Server is listening on port 3000');