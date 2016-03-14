window.app.controller('GameController',
  ['$scope', '$rootScope', '$http', '$interval', '$timeout',
  function($scope, $rootScope, $http, $interval, $timeout) {

  var socket = window.io();
  socket.emit('report', location.pathname);

  $scope.token = window.localStorage.getItem('token');
  $scope.status = 'active';
  $scope.isPaused = true;
  $scope.challenge = false;
  $scope.gems = 0;
  $scope.time = 60;
  $scope.level = 1;
  $scope.peer = [];
  $scope.icons = [];
  $scope.board = [];
  $scope.peerIdx = [];
  $scope.challenges = [];
  $scope.tries = 0;
  $scope.wins = 0;
  $scope.loss = 0;
  $scope.done = false;
  $scope.chapter = 'game';
  $scope.scores = [];
  $scope.activity = [];
  var interval = false;
  var tape = 9641;

  $scope.codeToS = function(code){
    return String.fromCharCode(code || 10033);
  };

  $scope.act = function(action){
    switch(action){
      case 'play':
        $scope.isPaused = false;
        $scope.time = 60;
        $scope.status = 'warning';
        socket.emit('play', {
          challenge: angular.copy($scope.challenge),
          level: angular.copy($scope.level)
        });
        break;
      case 'pause':
        $scope.isPaused = true;
        $scope.status = 'danger';
        destroyTimer();
        $scope.reset();
        break;
      case 'stop':
        destroyTimer();
        $scope.time = 0;
        $scope.isPaused = true;
        $scope.status = 'active';
        $scope.board = [];
        break;
      case 'done':
        $scope.gems += 1;
        $scope.level += 1;
        socket.emit('done', {
          challenge: angular.copy($scope.challenge),
          time: angular.copy($scope.time),
          board: angular.copy($scope.board),
          level: angular.copy($scope.level)
        });
        $scope.act('stop');
        break;
      default:
        timer();
        break;
    }
  };

  $scope.revealIcons = function(challenge){
    $scope.icons = printIcons(challenge.start, challenge.end);
  };

  $scope.removelIcons = function(){
    $scope.icons = [];
  };

  $scope.setChallenge = function(challenge){
    $scope.act('stop');
    $scope.challenge = challenge;
    socket.emit('anchor',{id: challenge._id});
  };

  $scope.attempt =  function(idx) {
    addOne(idx);

    if($scope.peer.length == 2 ){
      $scope.tries++;

      if ($scope.peer[0].c == $scope.peer[1].c){
        $scope.board[$scope.peerIdx[0]].s = 'done';
        $scope.board[$scope.peerIdx[1]].s = 'done';
        checkIsDone();
      }else{
        $scope.board[$scope.peerIdx[0]].s = 0;
        $scope.board[$scope.peerIdx[1]].s = 0;
        $scope.peer = [];
        $scope.peerIdx = [];
      }

      $scope.reset();
    }
  };

  $scope.reset = function(){
    $scope.peer = [];
    $scope.peerIdx = [];
  };

  $scope.setChapter = function (chapter) {
    $scope.chapter = chapter;
  };

  var addOne = function (idx){
    switch($scope.board[idx].s){
      case 'done':
        break;
      case 'selected':
        $scope.board[$scope.peerIdx[0]].s = 0;
        $scope.reset();
        break;
      default :
        $scope.board[idx].s = 'selected';
        $scope.peer.push($scope.board[idx]);
        $scope.peerIdx.push(idx);
        break;
      }
  };

  var checkForTimeInt = false;
  var timer = function(){
    checkForTimeInt = checkForTimeInt || $interval(function(){
      if($scope.time>0){
        $scope.time -= 1;
      }else{
        $scope.act('stop');
        clearInterval(checkForTimeInt);
      }
    }, 1000);
  };

  var destroyTimer = function(){
    if (angular.isDefined(checkForTimeInt)){
      $interval.cancel(checkForTimeInt);
      checkForTimeInt = false;
    }
    clearInterval(checkForTimeInt);
  };

  var printIcons = function(start, end){
    var icons = [];
    for(var i=start; i<end;i++){
      icons.push({icon: i, desc: ''});
    }
    return icons;
  };

  var checkIsDone = function (){
    var done = true;
    for(var idx in $scope.board){
      if($scope.board[idx].s != 'done'){
        done = false;
        break;
      }
    }

    if (done){
      $scope.act('done');
    }
  };

  //socket io events
  socket.on('info', function (data) {
    $timeout(function(){
      if(data.gems){
        $scope.gems = data.gems;
      }
      if(data.scores){
        $scope.scores = data.scores;
      }
      if(data.activity){
        $scope.activity = data.activity;
      }
      if(data.completed){
        $scope.completed = data.completed;
      }
    }, 1);
  });

  socket.on('join',function(data){
    $timeout(function(){
      for (var i = 0; i < $scope.challenges.length; i++) {
        var ch = $scope.challenges[i];
        if(ch._id === data.name){
          $scope.challenges[i].users = data.size;
          break;
        }
      }
    }, 1);
  });

  socket.on('level', function (level) {
    $timeout(function(){
      if (!level){
        $scope.error = 'Level not found';
        return ;
      }

      $scope.board = level.board;
      $scope.level = level.number;
      timer();
    }, 1);
  });

  socket.on('levels', function (levels) {
    $scope.levels = levels;
  });

  socket.on('challenges', function (challenges) {
    $timeout(function(){
      $scope.challenges = challenges;
    }, 1);
  });

  if($scope.token){
    socket.emit('identify', $scope.token);
  }

}]);
