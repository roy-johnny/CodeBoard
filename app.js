const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

const session = require('express-session');
const MongoStore = require('connect-mongo')(session);

const db = require('./db/db');
const dbURL = db.dbURL;
const sessionMiddleware = session({
    secret: '3zlehMsDmX',
    proxy: true,
    resave: true,
    saveUninitialized: true,
    store: new MongoStore({url: dbURL})
});
app.use(sessionMiddleware);
const sharedSession = require("express-socket.io-session");
app.socketSession = sharedSession(sessionMiddleware);

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser('Z8Vh55QfWFNd'));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', require('./routes/index'));
app.use('/prj', require('./routes/project'));
app.use('/proj', require('./routes/editor'));
app.use('/share', require('./routes/share'));
app.use('/resetpass', require('./routes/resetpass'));
app.get('/*', function (req, res) {
    res.redirect('/');
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
