const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors')
const storageRoute = require('./routes/storageRoute');
const bodyParser = require('body-parser');
const app = require('express')();
const { logRequest, logError } = require('./middlewares/loggingMiddleware')
const { configureMongoDb } = require('./config/mongodb');
const _ = require('lodash');

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors());

app.use(logRequest)
app.use('/storage-api/', storageRoute);
app.use(logError)

app.use(function (req, res, next) {
  next(createError(404));
});

app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

const server = require('http').createServer(app);

module.exports = {
  server,
  configureMongoDb,
}
