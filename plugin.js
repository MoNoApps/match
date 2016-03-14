var events = require('./sio/events');

var api = { GET: {}, POST: {} };
var web = {};
var sio = {
  'play': events.play,
  'done': events.done,
  'match': events.match,
  'anchor': events.anchor,
  'levels': events.levels,
  'changes': events.changes,
  'metrics': events.metrics,
  'activity': events.activity,
  'completed': events.completed,
  'challenges': events.challenges
};
var tests = {};
var assets = {};
var helpers = {};

module.exports.api = api;
module.exports.web = web;
module.exports.sio = sio;
module.exports.tests = tests;
module.exports.assets = assets;
module.exports.helpers = helpers;
