// ----------------------------------   DEPENDENCIES  ----------------------------------------------
const express = require('express');
const bcrypt = require('bcrypt');
const app = express();
const handlebars = require('express-handlebars');
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

  // -------------------------------------  ROUTES for login.hbs   ----------------------------------------------
const user = {
  user_id: undefined,
  username: undefined,
  first_name: undefined,
  last_name: undefined,
  email: undefined,
};

app.get('/login', (req, res) => {
  res.render('pages/login');
});

// Login submission
app.post('/login', (req, res) => {
  const username = req.body.username;
  const query = 'select * from students where user.username = $1 LIMIT 1';
  const values = [username];

  // get the student_id based on the emailid
  db.one(query, values)
    .then(data => {
      user.user_id = data.user_id;
      user.username = username;
      user.first_name = data.first_name;
      user.last_name = data.last_name;
      user.email = data.email;

      req.session.user = user;
      req.session.save();

      res.redirect('/');
    })
    .catch(err => {
      console.log(err);
      res.redirect('/login');
    });
});

// -------------------------------------  ROUTES for logout.hbs   ----------------------------------------------

app.get('/logout', (req, res) => {
  req.session.destroy(function(err) {
    res.render('pages/logout');
  });
});

// register.hbs Routing

app.get('/register', (req, res) => {
  res.render('pages/register');
});

app.post('/register', async (req, res) => {
  const { first_name, last_name, email, password } = req.body;

  try {
    const hashed = await bcrypt.hash(password, 12);
    const query = `
      INSERT INTO students (first_name, last_name, email, password_hash)
      VALUES ($1, $2, $3, $4)
      RETURNING user_id
    `;
    const result = await db.one(query, [first_name, last_name, email, hashed]);

    req.session.user = {
      user_id: result.user_id,
      first_name,
      last_name,
      email,
    };

    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.render('pages/register', { error: 'Registration failed. Try again.' });
  }
});


// -------------------------------------  START THE SERVER   ----------------------------------------------

app.listen(3000);
console.log('Server is listening on port 3000');