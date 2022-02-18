// db Connection
const db = require('./connection/db');

// Pemanggilan Package express
const express = require('express');

// menggunakan package express
const app = express();

// Import package bcrypt
const bcrypt = require('bcrypt');

// import package express-flash and express-session
const flash = require('express-flash');
const session = require('express-session');

// import middleware upload
const upload = require('./middlewares/uploadFile');

// set up template engine
app.set('view engine', 'hbs');

// export folder agar bisa diakses oleh client
app.use('/public', express.static(__dirname + '/public'));
app.use('/uploads', express.static(__dirname + '/uploads'));

// menampilkan data dengan post
app.use(express.urlencoded({ extended: false }));

// use express-flash
app.use(flash());

// setup session midleware
app.use(
  session({
    cookie: {
      maxAge: 1000 * 60 * 60 * 2,
      secure: false,
      httpOnly: true,
    },
    store: new session.MemoryStore(),
    saveUninitialized: true,
    resave: false,
    secret: 'secretValue',
  })
);

const projects = [
  {
    name_project: 'Dumbsways Fullstack Programmer',
    startdate: '12 januari 2022',
    enddate: '12 februari 2022',
    description: 'Kamu Bisa Menjadi Fullsatck Programmer',
  },
];

// Set endpoint
app.get('/', function (request, response) {
  response.render('home', { isLogin: req.session.isLogin, user: req.session.user });
});

// Set endpoint home untuk menerima data
app.get('/home', function (request, response) {
  let query;
  if (request.session.isLogin) {
    query = `SELECT tb_projects.id,tb_projects.name,start_date,end_date,description,technologies,image,author_id
                    FROM tb_projects 
                    INNER JOIN tb_users 
                    ON tb_users.id = tb_projects.author_id
                    WHERE author_id = ${request.session.user.id}`;
  } else {
    query = `SELECT tb_projects.id,tb_projects.name,start_date,end_date,description,technologies,image,author_id
                    FROM tb_projects 
                    INNER JOIN tb_users 
                    ON tb_users.id = tb_projects.author_id`;
  }

  db.connect(function (err, client, done) {
    if (err) throw err;
    client.query(query, function (err, result) {
      done();
      if (err) throw err;

      let data = result.rows;
      data = data.map((project) => {
        return {
          ...project,
          isLogin: request.session.isLogin,
        };
      });
      response.render('index', {
        isLogin: request.session.isLogin,
        user: request.session.user,
        projects: data,
      });
    });
  });
});

// set endpoint project
app.get('/add-project', function (request, response) {
  if (!request.session.isLogin) {
    response.redirect('/home');
  }
  response.render('myproject');
});

// set end point untuk menangkap data
app.post('/project', upload.single('image'), function (request, response) {
  let { projectname, startdate, enddate, description, technologies } = request.body;
  //   response.send(`<script>alert("nama project : ${title_project} Pengerjaan Awal : ${startdate} , selesai :${enddate}, dekripsi : ${description}.")</script>`);
  let project = {
    projectname,
    startdate,
    enddate,
    description,
    technologies,
    image: request.file.filename,
    author_id: request.session.user.id,
  };
  db.connect((err, client, done) => {
    if (err) throw err;
    let query = `INSERT INTO tb_projects (name,start_date,end_date,description,technologies,image,author_id) VALUES
    ('${project.projectname}','${project.startdate}','${project.enddate}','${project.description}','${project.technologies}','${project.image}','${project.author_id}')`;

    client.query(query, (err, result) => {
      done();
      if (err) throw err;
      response.redirect('/home');
    });
  });
});

// set endpoint blog detail
app.get('/project/:id', function (request, response) {
  let id = request.params.id;

  db.connect((err, client, done) => {
    if (err) throw err;
    let query = `select * from tb_projects where id =${id}`;
    client.query(query, (err, result) => {
      done();
      if (err) throw err;
      result = result.rows[0];
      response.render('detail-project', { project: result });
    });
  });
});

// set endpoint delete project

app.get('/delete-project/:id', function (request, response) {
  let id = request.params.id;
  db.connect((err, client, done) => {
    if (err) throw err;
    let query = `delete from tb_projects where id=${id}`;

    client.query(query, (err, result) => {
      done();
      if (err) throw err;
      response.redirect('/home');
    });
  });
});

// set end point update project
app.get('/update-project/:id', function (request, response) {
  let id = request.params.id;

  db.connect((err, client, done) => {
    if (err) throw err;
    let query = `select * from tb_projects where id=${id}`;
    client.query(query, (err, result) => {
      done();
      if (err) throw err;
      result = result.rows[0];

      response.render('update-project', { project: result });
    });
  });
});

app.post('/update-project/:id', function (request, response) {
  let { id } = request.params;
  let { projectname, startdate, enddate, description, technologies } = request.body;
  let query = `update tb_projects set name='${projectname}',start_date='${startdate}',end_date='${enddate}',description='${description}',technologies='${technologies}' where id =${id}`;
  db.connect((err, client, done) => {
    if (err) throw err;
    client.query(query, (err, result) => {
      done();
      if (err) throw err;
      response.redirect('/home');
    });
  });
});

// set endpoint contact
app.get('/contact-me', function (request, response) {
  if (!request.session.isLogin) {
    response.render('contact');
  }
  response.render('contact', { isLogin: request.session.isLogin });
});

// set endpoint register
app.get('/register', function (req, res) {
  res.render('register');
});

app.post('/register', function (req, res) {
  let { name, email, password } = req.body;

  let hashPassword = bcrypt.hashSync(password, 10);

  db.connect((err, client, done) => {
    if (err) throw err;

    let query = `INSERT INTO tb_users(nama, email, password) VALUES
                        ('${name}','${email}','${hashPassword}')`;

    client.query(query, (err, result) => {
      done();
      if (err) throw err;
      req.flash('success', 'Account succesfully registered ');
      res.redirect('/login');
    });
  });
});

// set endpoint Login
app.get('/login', function (req, res) {
  res.render('login');
});

app.post('/login', function (req, res) {
  let { email, password } = req.body;

  db.connect((err, client, done) => {
    if (err) throw err;

    let query = `SELECT * FROM tb_users WHERE email='${email}'`;

    client.query(query, (err, result) => {
      done();
      if (err) throw err;

      if (result.rows.length == 0) {
        req.flash('danger', 'Account not found!');
        return res.redirect('/login');
      }

      let isMatch = bcrypt.compareSync(password, result.rows[0].password);

      if (isMatch) {
        req.session.isLogin = true;
        req.session.user = {
          id: result.rows[0].id,
          email: result.rows[0].email,
          name: result.rows[0].name,
        };
        req.flash('success', 'Login Success');
        res.redirect('/home');
      } else {
        res.redirect('/login');
      }
    });
  });
});

// set endpoint logout
app.get('/logout', function (req, res) {
  req.session.destroy();
  res.redirect('/home');
});

// Konfigurasi Port Aplikasi

const port = 5001;
app.listen(port, function () {
  console.log(`server running on : ${port}`);
});
