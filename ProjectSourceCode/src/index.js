// ----------------------------------   DEPENDENCIES  ----------------------------------------------
const express = require('express');
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
  email: undefined,
  password_hash: undefined,
  icon_url: undefined,
  privilege: undefined,
};

// const posts = `
//   SELECT DISTINCT
//     posts.post_id,
//     posts.post_title,
//     posts.posts_,
//     students.student_id = $1 AS "taken"
//   FROM
//     courses
//     JOIN student_courses ON courses.course_id = student_courses.course_id
//     JOIN students ON student_courses.student_id = students.student_id
//   WHERE students.student_id = $1
//   ORDER BY courses.course_id ASC;`;

// const all_courses = `
//   SELECT
//     courses.course_id,
//     courses.course_name,
//     courses.credit_hours,
//     CASE
//     WHEN
//     courses.course_id IN (
//       SELECT student_courses.course_id
//       FROM student_courses
//       WHERE student_courses.student_id = $1
//     ) THEN TRUE
//     ELSE FALSE
//     END
//     AS "taken"
//   FROM
//     courses
//   ORDER BY courses.course_id ASC;
//   `;

app.get('/login', (req, res) => {
  res.render('pages/login');
});

// Login submission
app.post('/login', (req, res) => {
  const email = req.body.email;
  const username = req.body.username;
  const query = 'select * from users where users.email = $1 LIMIT 1';
  const values = [email];

  // get the student_id based on the emailid
  db.one(query, values)
    .then(data => {
      user.user_id = data.user_id;
      user.username = username;
      user.email = data.email;
      user.icon_url = data.icon_url;
      user.password_hash = data.password_hash;

      req.session.user = user;
      req.session.save();

      res.redirect('/');
    })
    .catch(err => {
      console.log(err);
      res.redirect('/login');
    });
});

// Authentication middleware.
const log_auth = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
};

app.use('/login', log_auth);

// -------------------------------------  ROUTES for home.hbs   ----------------------------------------------

app.get('/', (req, res) => {
  res.render('pages/home', {
    
  });
});

// -------------------------------------  ROUTES for logout.hbs   ----------------------------------------------

app.get('/logout', (req, res) => {
  req.session.destroy(function(err) {
    res.render('pages/logout');
  });
});

// -------------------------------------  ROUTES for register.hbs   ----------------------------------------------

// const posts = `
//   SELECT DISTINCT
//     posts.post_id,
//     posts.post_title,
//     posts.posts_,
//     students.student_id = $1 AS "taken"
//   FROM
//     courses
//     JOIN student_courses ON courses.course_id = student_courses.course_id
//     JOIN students ON student_courses.student_id = students.student_id
//   WHERE students.student_id = $1
//   ORDER BY courses.course_id ASC;`;

// const all_courses = `
//   SELECT
//     courses.course_id,
//     courses.course_name,
//     courses.credit_hours,
//     CASE
//     WHEN
//     courses.course_id IN (
//       SELECT student_courses.course_id
//       FROM student_courses
//       WHERE student_courses.student_id = $1
//     ) THEN TRUE
//     ELSE FALSE
//     END
//     AS "taken"
//   FROM
//     courses
//   ORDER BY courses.course_id ASC;
//   `;

app.get('/register', (req, res) => {
  res.render('pages/register');
});

// Register submission
app.post('/register', (req, res) => {
  const email = req.body.email;
  const username = req.body.username;
  const query = 'select * from users where users.email = $1 LIMIT 1';
  const values = [email];

  // get the student_id based on the emailid
  db.one(query, values)
    .then(data => {
      user.user_id = data.user_id;
      user.username = username;
      user.email = data.email;
      user.icon_url = data.icon_url;
      user.password_hash = data.password_hash;

      req.session.user = user;
      req.session.save();

      res.redirect('/');
    })
    .catch(err => {
      console.log(err);
      res.redirect('/register');
    });
});

// Authentication middleware.
const reg_auth = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/register');
  }
  next();
};

app.use('/register', reg_auth);

// -------------------------------------  START THE SERVER   ----------------------------------------------

app.listen(3000);
console.log('Server is listening on port 3000');