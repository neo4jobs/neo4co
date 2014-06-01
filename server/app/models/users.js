'use strict';

// ## Module Dependencies
var _ = require('lodash');
var Architect = require('neo4j-architect');
var db = require('../db');
var QueryBuilder = require('../neo4j-qb/qb.js');
var utils = require('../utils');
var when = require('when');

Architect.init();

var Construct = Architect.Construct;

// Presently only schema properties are being used in the query builder. 
// The value doesn't matter right now.
var schema = {
  id: String,
  firstname: String,
  lastname: String,
  email: String,
  linkedInToken: String,
  profileImage: String
};

var qb = new QueryBuilder('User', schema);

// ## Model

var User = function (_data) {
  _.extend(this, _data);

  // get the id from the self property returned by neo4j
  this.nodeId = +this.self.split('/').pop();
};

User.prototype.modelName = 'User';


// ## Results Functions
// To be combined with queries using Construct

var _singleUser = _.partial(utils.formatSingleResponse, User);
var _manyUsers = _.partial(utils.formatManyResponse, User);


// ## Query Functions
// Should be combined with results functions using Construct

var _matchByUUID = qb.makeMatch(['id']);

var _matchAll = qb.makeMatch();

var _create = (function () {
  
  var onCreate = {
    created: 'timestamp()'
  };

  return qb.makeMerge(['id'], onCreate);
})();

var _update = qb.makeUpdate(['id']);

var _delete = qb.makeDelete(['id']);

var _deleteAll = qb.makeDelete();

var _createManySetup = function (params, callback) {
  if (params.list && _.isArray(params.list)) {
    callback(null, _.map(params.list, function (data) {
      return _.pick(data, Object.keys(schema));
    }));
  } else {
    callback(null, []);
  }
};


// ## Constructed Functions

// var create = function (params, options, callback) {
//   var func = new Construct(_create, _singleUser);
  
//   // Do any data cleaning/prep here

//   func.done().call(this, params, options, callback);
// };

var create = function (params, options) {
  var func = new Construct(_create, _singleUser);
  var promise = when.promise(function (resolve) {

    // @NOTE Do any data cleaning/prep here...
    
    func.done().call(null, params, options, function (err, results, queries) {
      resolve({results: results, queries: queries});
    });
  });

  return promise;
};

// create many new users
var createMany = new Construct(_createManySetup).map(create);

var getById = new Construct(_matchByUUID).query().then(_singleUser);
// var getById = new Construct(_matchByUUID, _singleUser);

var getAll = new Construct(_matchAll, _manyUsers);

// get a user by id and update their properties
var update = new Construct(_update, _singleUser);

// delete a user by id
var deleteUser = new Construct(_delete);

// delete a user by id
var deleteAllUsers = new Construct(_deleteAll);

// relationships:

User.prototype.knows = function (toUser, callback) {
  var that = this;
  var query = [];
  
  query.push('START a=node({from}), b=node({to})');
  query.push('CREATE UNIQUE (a)-[:KNOWS]->(b)');
  var qs = query.join('\n');

  db.query(qs, {from: that.nodeId, to: toUser.nodeId}, callback);
};

User.prototype.joined = function (callback) {
  var that = this;
  var query = [];
  
  query.push('MATCH (a) WHERE id(a) = {from}');
  query.push('(b:Users)');
  query.push('CREATE UNIQUE (a)-[:JOINED {date:timestamp()}]->(b)');
  var qs = query.join('\n');

  db.query(qs, {from: that.nodeId}, callback);
};

User.prototype.hasSkill = function (toSkill, callback) {
  var that = this;
  var query = [];
  
  query.push('START a=node({from}), b=node({to})');
  query.push('CREATE UNIQUE (a)-[:HAS_SKILL]->(b)');
  var qs = query.join('\n');

  db.query(qs, {from: that.nodeId, to: toSkill.nodeId}, callback);
};


// static methods:

User.create = create;
User.createMany = createMany.done();
User.deleteUser = deleteUser.done();
User.deleteAllUsers = deleteAllUsers.done();
User.getById = getById.done();
User.getAll = getAll.done();
User.update = update.done();

module.exports = User;