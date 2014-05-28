'use strict';

// ## Module Dependencies
var _ = require('lodash');
var sw = require('swagger-node-express');
var utils = require('../../utils');

// ## Models
var User = require('../../models/users');

var param = sw.params;
var swe = sw.errors;


// ## Helpers
var _prepareParams = function (req) {
  var params = req.body;

  params.userId = req.params.userId || req.body.userId;

  return params;
};

// callback helper function
// 
// This is meant to be bound to a new function within the endpoint request callback
// using _partial(). The first two parameters should be provided by the request callback 
// for the endpoint this is being used in.
//
// Example:
//
// action: function(req, res) {
//   var errLabel = 'Route: POST /users';
//   var callback = _.partial(_callback, res, errLabel);
// }
var _callback = function (res, errLabel, err, results, queries) {
  var start = new Date();

  if (err || !results) {
    if (err) console.error(errLabel + ' ', err);
    swe.invalid('input', res);
    return;
  }

  utils.writeResponse(res, results, queries, start);
};


// ## API Specs

// Route: GET '/users'
exports.list = {

  spec: {
    description : 'List all users',
    path : '/users',
    method: 'GET',
    summary : 'Find all users',
    notes : 'Returns all users',
    type: 'object',
    items: {
      $ref: 'User'
    },
    produces: ['application/json'],
    parameters : [],
    responseMessages: [swe.notFound('users')],
    nickname : 'getUsers'
  },

  action: function (req, res) {
    var options = {};
    var errLabel = 'Route: GET /users';
    var callback = _.partial(_callback, res, errLabel);
    
    options.neo4j = utils.existsInQuery(req, 'neo4j');

    User.getAll(null, options, callback);
  }
};


// Route: POST '/users'
exports.addUser = {
  
  spec: {
    path : '/users',
    notes : 'adds a user to the graph',
    summary : 'Add a new user to the graph',
    method: 'POST',
    type : 'object',
    items : {
      $ref: 'User'
    },
    parameters : [
      param.form('userId', 'User UUID', 'string', true),
      param.form('firstname', 'User firstname', 'string', true),
      param.form('lastname', 'User lastname', 'string', true),
      param.form('email', 'User email', 'string', false),
      param.form('linkedInToken', 'LinkedIn OAuth Token', 'string', false),
      param.form('profileImage', 'User profile image url', 'string', false),
      param.form('skills', 'User skills', 'array', false),
      param.form('roles', 'User past and present roles', 'array', false),
      param.form('location', 'User\'s current location', 'object', false)
    ],
    responseMessages : [swe.invalid('input')],
    nickname : 'addUser'
  },

  action: function(req, res) {
    var options = {};
    var params = {};
    var errLabel = 'Route: POST /users';
    var callback = _.partial(_callback, res, errLabel);

    options.neo4j = utils.existsInQuery(req, 'neo4j');
    params = _prepareParams(req);

    User.create(params, options, callback);

    // The below method uses the neo4j module's db.createNode method
    // It works but is limiting because you cannot add labels.

    // var params = _prepareParams(req);
    // var node = db.createNode(params);
    // var errLabel = 'Route: POST /users';
    // var callback = _.partial(_callback, res, errLabel);

    // node.save(callback);
  }
};

// Route: POST '/users/batch'
exports.addUsers = {
  
  spec: {
    path : '/users/batch',
    notes : 'adds a user to the graph',
    summary : 'Add multiple users to the graph',
    method: 'POST',
    type : 'object',
    parameters : [
      param.form('users', 'Array of user object JSON strings', 'array', true),
    ],
    responseMessages : [swe.invalid('users')],
    nickname : 'addUsers'
  },

  action: function(req, res) {
    var options = {};
    var params = req.body;
    var errLabel = 'Route: POST /users';
    var callback = _.partial(_callback, res, errLabel);
    var users = JSON.parse(params.users);

    if (!users.length) throw swe.invalid('users');

    // @TODO 
    // should probably check to see if all user objects contain the minimum
    // required properties (userId, firstname, lastname, etc) and stop if not.

    options.neo4j = utils.existsInQuery(req, 'neo4j');

    var getNextUser = function (index, length, collection) {
      var next = index + 1;
      if (next >= length) {
        next = 0;
      }

      return collection[next].data;
    };

    User.createMany({users:users}, options, function (err, results) {
      _.each(results, function (user, index, results) {
        var nextUser = getNextUser(index, results.length, results);

        user.data.knows(nextUser, function (err, res) {
          console.log(err, res);
        });
      });

      callback(err, results);
    });
  }
};

// Route: DELETE '/users'
exports.deleteAllUsers = {
  spec: {
    path: '/users',
    notes: 'Deletes all users and their relationships',
    summary: 'Delete all users',
    method: 'DELETE',
    type: 'object',
    nickname : 'deleteAllUsers'
  },

  action: function (req, res) {
    var options = {};
    var errLabel = 'Route: DELETE /users';
    var callback = _.partial(_callback, res, errLabel);

    options.neo4j = utils.existsInQuery(req, 'neo4j');

    User.deleteAllUsers(null, options, callback);
  }
};


// Route: GET '/users/:userId'
exports.findById = {
  
  spec: {
    path: '/users/{userId}',
    notes: 'Returns a user based on ID',
    summary: 'Find user by ID',
    method: 'GET',
    type: 'object',
    parameters : [
      param.path('userId', 'ID of user that needs to be fetched', 'string'),
    ],
    responseMessages : [swe.invalid('userId'), swe.notFound('user')],
    nickname : 'getUserById'
  },

  action: function (req, res) {
    var userId = req.params.userId;
    var options = {};
    var params = {};

    if (!userId) throw swe.invalid('userId');

    var errLabel = 'Route: GET /users/{userId}';
    var callback = _.partial(_callback, res, errLabel);

    options.neo4j = utils.existsInQuery(req, 'neo4j');
    params = _prepareParams(req);

    User.getById(params, options, callback);
  }
};

// Route: POST '/users/:userId'
exports.updateById = {

  spec: {
    path: '/users/{userId}',
    notes: 'Updates an existing user',
    summary: 'Update a user',
    method: 'POST',
    type: 'object',
    items: {
      $ref: 'User'
    },
    parameters : [
      param.path('userId', 'ID of user that needs to be fetched', 'string'),
      param.form('firstname', 'User firstname', 'string', true),
      param.form('lastname', 'User lastname', 'string', true),
      param.form('email', 'User email', 'string', false),
      param.form('linkedInToken', 'LinkedIn OAuth Token', 'string', false),
      param.form('profileImage', 'User profile image url', 'string', false),
    ],
    responseMessages : [swe.invalid('input')],
    nickname : 'updateUser'
  },

  action: function (req, res) {
    var userId = req.params.userId;
    var options = {};
    var params = {};

    if (!userId) throw swe.invalid('userId');

    var errLabel = 'Route: POST /users/{userId}';
    var callback = _.partial(_callback, res, errLabel);

    options.neo4j = utils.existsInQuery(req, 'neo4j');
    params = _prepareParams(req);

    User.update(params, options, callback);
  }
};

// Route: DELETE '/users/:userId'
exports.deleteUser = {

  spec: {
    path: '/users/{userId}',
    notes: 'Deletes an existing user and his/her relationships',
    summary: 'Delete a user',
    method: 'DELETE',
    type: 'object',
    parameters: [
      param.path('userId', 'ID of user to be deleted', 'string'),
    ],
    responseMessages: [swe.invalid('input')],
    nickname : 'deleteUser'
  },

  action: function (req, res) {
    var userId = req.params.userId;
    var options = {};
    var params = {};

    if (!userId) throw swe.invalid('userId');

    var errLabel = 'Route: DELETE /users/{userId}';
    var callback = _.partial(_callback, res, errLabel);

    options.neo4j = utils.existsInQuery(req, 'neo4j');
    params = _prepareParams(req);

    User.deleteUser(params, options, callback);
  }
};