// REST API Endpoints
const artists = require('./api/artists');
const albums = require('./api/albums');
const errors = require('./api/errors');

// MODEL
const unqmod = require('./unqfy');

// EXPRESS
const express = require('express'); // call express
const app = express(); // define our app using express
const bodyParser = require('body-parser');

const router = express.Router();
const port = process.env.PORT || 5000; // set our port
const model = { };

// JSON Parser (string body -> object)
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// Middleware
router.use((req, res, next) => {
  
  console.log('REQUEST: ', req.body);

  // Load unqfy before processing the request.
  model.unqfy = unqmod.getUNQfy();

  // Save unqfy once we finish generating a response.
  res.on('finish', () => {
    model.unqfy.save('estado');
  });

  // Execute next middleware in the chain.
  next();
});

// Declare 'api' as our root url.
app.use('/api', router);

// Parse ID path arguments so we can match :id on our url paths.
router.param('id', (req, res, next, id) => {
  req.model = {
    id: parseInt(id),
  };
  next();
});

// Register our custom endoints.
artists.register(router, model);
albums.register(router, model);

// Error handler. Return any exception as an error in json format.
// app.use((err, req, res, next) => {
//   if (err.status === 400 && err.type === 'entity.parse.failed') {
//     res.status(400);
//     res.json(errors.BAD_REQUEST);
//   } else if (err.errorCode || err.status) {
//     res.status(err.status);
//     res.json(err);
//   } else if (res.json) {
//     res.json({error : err});
//   } else {
//     next();
//   }
// });

app.use((req, res) => {
  res.contentType('json');
  res.status(errors.RESOURCE_NOT_FOUND.status);
  res.send(JSON.stringify(errors.RESOURCE_NOT_FOUND));
});

// Start server.
app.listen(port);
console.log('Magic happens on port ' + port);

