"use strict";

var assert = require("assert");
var async = require("async");
var keys = require("underscore").keys;
var Sequelize = require("sequelize");

var config = require('./config');
var DB = require('./db');

var schema = {
  uuid: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV1,
    primaryKey: true
  },
  owner: {
    type: Sequelize.UUID,
    allowNull: false,
  },
  id: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  version: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 0, // first version
    validate: {
      min: 0,
    },
  },
  status: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 1, // 0: deleted, 1: active
    validate: {
      min: 0,
      max: 1,
    }
  },
  data: {
    type: Sequelize.JSON,
    allowNull: false,
    defaultValue: {},
  },
};

var Project = DB.define('project', schema, {
  paranoid: false,
  indexes: [
    {
      fields: ['owner', 'id', 'version'],
      unique: true,
    },
  ],
});

// initialize the DB
var init = function(otherTables, callback) {
  otherTables = otherTables || [];
  assert(Array.isArray(otherTables));

  async.series([
    function (cb) {
      Project.sync().then(function () {
        cb(null);
      }).catch( function (e) {
        cb(e);
      });
    },
    function (cb) {
      async.mapSeries(otherTables, function (table, done) {
        table.sync().then(function () {
          done(null);
        }).catch(function (e) {
          done(e);
        });
      }, cb);
    },
  ], function (err) {
    callback(err);
  });
};

module.exports = Project;
module.exports.init = init;
