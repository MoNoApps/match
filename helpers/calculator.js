//Time in secs not milis
//Time progresive from 0 to 60

module.exports = function(time) {
  if (time <  5) { return 7; }
  if (time < 10) { return 6; }
  if (time < 20) { return 5; }
  if (time < 30) { return 4; }
  if (time < 40) { return 3; }
  if (time < 50) { return 2; }
  return 1;
};

