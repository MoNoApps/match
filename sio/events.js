var db = require('../../../helpers/models');
var review = require('../../../helpers/manager').review;

function _clean(scores) {
  for (var c in scores) {
    if (scores.hasOwnProperty(c)) {
      scores[c].email = scores[c].email.split('@')[0];
    }
  }
  return scores;
}

function shufle(o) {
  for (var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
  return o;
}

function metrics(socket, cb) {
  review(
    { req:
      {params: {token: socket.token} },
      res: {}
    }, function(err, opt) {
      db.metrics.Find({}, function (err, rsp) {
        cb(err, _clean(rsp));
      },
      {email: 1, gems: 1, name: 1, level: 1},
      {w: 1},
      1000,
      {gems: 1}
    );
  });
}

function levels(socket, cb) {
  review({ req: {params: {token: socket.token} }, res: {} }, function (err, opt) {
    db.levels.Find({}, function(err, rsp){
      cb(err, rsp);
    });
  });
}

function play(data, cb) {
  review({ req: {params: {token: data.token} }, res: {} }, function (err, opt) {
    var ch = data.challenge;
    var query = {range: ch.start + '::' + ch.end, number: (data.number + 1)};

    db.levels.FindOne(query, function (err, rsp) {
      if (rsp) {
        rsp.board = shuffle(rsp.board);
        rsp.timestamp = new Date().getTime();

        cb(err, rsp);
      } else {
        cb('Level not found.', false);
      }
    });
  });
}

function challenges(socket, cb) {
  db.challenges.Find({}, function (err, rsp) {
    cb(err, rsp);
  });
}

function changes(opts) {
  opts.socket.join(opts.name);

  var msg = {name: opts.name};
  msg.size = opts.sio.of(opts.name).server.eio.clientsCount;
  opts.socket.broadcast.to('match').emit('join', msg);
}

function done(data, cb) {
  review({ req: {params: {token: data.token} }, res: {} }, function (err, opt) {
    var calc = require('../helpers/calculator');
    var now = new Date().getTime();
    var init = data.level.timestamp;
    var real = now - init;
    var amount = calc(real/1000);
    var record = {$inc: {gems: amount, level: 1}};
    var reset = {$set: {level: 0}, $inc: {gems: amount}};

    var resume = {
      user: opt.user._id.toString(),
      name: data.challenge.name,
      challenge: data.challenge._id.toString(),
      time: data.time,
      mili: init,
      level: data.level._id.toString(),
      real: real,
      date: now,
      number: data.level.number,
      gems: amount
    };

    var query = {
      user: opt.user._id.toString(),
      email: opt.user.email,
      name: data.challenge.name,
      challenge: data.challenge._id.toString()
    };

    db.history.Insert(resume);

    if (data.challenge.length === (data.level.number)) {
      db.metrics.Update(query, reset, {upsert: true}, function (err, ack) {
        query.ts = now;
        query.date = new Date(now).toUTCString();
        db.completed.Insert(query);
        cb(err, true);
      });
    } else {
      db.metrics.Update(query, record, {upsert: true}, function (err, ack) {
        cb(err, true);
      });
    }

  });
}

function activity(socket, cb) {
  review({ req: {params: {token: socket.token} }, res: {} }, function (err, opt) {
    db.history.Find({user: opt.user._id.toString()},
      function (err, activity) {
        cb(err, activity);
      },
      {},
      {w: 1},
      1000,
      {number: 1}
    );
  });
}

function completed(socket, cb) {
  review({ req: {params: {token: socket.token} }, res: {} }, function (err, opt) {
    db.completed.Find({user: opt.user._id.toString()},
      function (err, results) {
        cb(err, results);
      }
    );
  });
}

function anchor(socket, cb) {
  review({ req: {params: {token: socket.token} }, res: {} }, function (err, opt) {
    db.challenges.FindByObjectId({_id: socket.anchor}, '_id', function (err, challenge) {
      cb(err, challenge);
    });
  });
}

function match(socket, cb) {
  review({ req: {params: {token: socket.token} }, res: {} }, function (err, opt) {
    var query = {
      user: opt.user._id.toString(),
      challenge: socket.anchor
    };
    db.metrics.FindOne(query, function (err, metric) {
      if (metric) { cb(err, metric.level); }
      else { cb(err, 0); } 
    });
  });
}

module.exports = {
  play: play,
  done: done,
  match: match,
  anchor: anchor,
  levels: levels,
  changes: changes,
  metrics: metrics,
  activity: activity,
  completed: completed,
  challenges: challenges
};
