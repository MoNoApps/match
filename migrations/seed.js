var db = require('../../../helpers/models');
var challenges = require('./data/challenges.json');
var levels = require('../helpers/levels');

function persist(list, model) {
  for (var r in list){
    if(list.hasOwnProperty(r)){
      model.Insert(list[r]);
    }
  }
}

function countLevels() {
  for (var c in challenges){
    if(challenges.hasOwnProperty(c)){
      var clevels = levels(challenges[c].start, challenges[c].end);
      persist(clevels, db.levels);
      challenges[c].length = clevels.length;
    }
  }
}

function addMenu(model) {
  db.settings.Update(
    {'type': 'properties'},
    { $pull: { 'data.admin': model} },
    {w: 1}, function() {
    db.settings.Update(
      {'type' : 'properties'},
      { $push: { 'data.admin': model} }
    );
  });
}

addMenu('levels');
addMenu('challenges');
addMenu('history');

persist(challenges, db.challenges);
countLevels();
