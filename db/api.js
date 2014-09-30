var mongojs = require('mongojs');
var chatUrl = process.env.chatUrl || 'chat';
var db = mongojs(chatUrl, ['users']);
var async = require('async');

// Sends back info about user that logged in such as name,
// also sends back list of the user's friends
exports.login = function(req, res) {

  console.log('req.query', req.query);

  var userID = +req.query.userID;

  db.users.findOne({
    id: userID
  }, function(err, user) {
    if (err) {
      console.log('error in finding user');
      res.status(404).send('error in finding user');
    } else {
      if (user) {

        console.log('user in getFriends function', user);
        var userFriends = user.friendIds || [];

        // find all of a user's friend ids
        async.map(userFriends, function(friendID, callback) {
          console.log('friendID in async.map', friendID);

          exports.findFriend(friendID, callback);

        }, function(err, friends) {
          if (err) {
            res.status(404).send('error in finding friends');
          } else {
            // if list of friends was found
            if (friends) {
              // also send back user's name
              var userObj = {
                friends: friends,
                name: user.name
              };
              res.status(200).send(userObj);
            } else {
              res.send('you have no friends');
            }
          }
        });

      } else {
        console.log('user could not be found');
        res.send('user could not be found');
      }
    }
  });
};

// helper function used in async map call to find one friend.
// this function is called repeatedly to find all of a user's friends
exports.findFriend = function(friendID, callback) {
  db.users.findOne({
    id: friendID
  }, function(err, user) {
    if (err) {
      console.log('error in finding user');
      // call callback with error, and user as null
      callback(err, null);
    } else {
      if (user) {
        var friend = {
          name: user.name,
          id: user.id
        };
        // call callback with error as null, and with friend that was found 
        callback(null, friend);
      } else {
        console.log('user not found');
        callback(null, null);
      }
    }
  });
};

// saves message to message array of both sender and receiver
exports.saveMessage = function(msg) {
  console.log(msg);

  // save messages to receiver
  db.users.findOne({
    id: msg.to
  }, function(err, user) {
    if (err) {
      console.log('error in finding user');
    } else {
      if (user) {
        // if this is first msg sent to this person, msg array needs to be created
        user.messages[msg.from] = user.messages[msg.from] || [];

        // save message object with a text property and a fromUsrname property
        user.messages[msg.from].push({ text: msg.text, fromUsername: msg.fromUsername });
        db.users.save(user, function(err, user, lastErrObj) {
            console.log('message saved in db');
        });
      } else {
        console.log('friend user object could not be found');
      }
    }
  });

  // also save messages to sender
  db.users.findOne({
    id: msg.from
  }, function(err, user) {
    if (err) {
      console.log('error in finding user');
    } else {
      if (user) {
        // if this is first msg sent to this person, msg array needs to be created
        user.messages[msg.to] = user.messages[msg.to] || [];

        user.messages[msg.to].push({ text: msg.text, fromUsername: msg.fromUsername });
        db.users.save(user, function(err, user, lastErrObj) {
            console.log('message saved in db');
        });
      } else {
        console.log('current user object could not be found');
      }
    }
  });
};

// retrieve list of message objects and send to client
exports.getMessages = function(req, res, io) {

  console.log('inside get messages');

  // the ids come in on the req.query obj as a string for some reason
  // '+' operator converts to number
  var userID = +req.query.userID;
  var friendID = +req.query.friendID;

  console.log('userID', userID);
  console.log('friendID', friendID);

  // for reasons I do not understand, if there is any uncaught
  // error in here, it shows as a CORS error on the client side
  db.users.findOne({
    id: userID
  }, function(err, user) {
    if (err) {
      res.status(404).send({ err: err, msg: 'error trying to find user' });
    } else {
      if (user) {
        console.log('current user object', user);
        // create messages array if these two friends have never
        // exchanged messages yet
        user.messages[friendID] = user.messages[friendID] || [];
        var messages = user.messages[friendID];
        for (var i = 0; i < messages.length; i++) {
          var msg = {
            to: userID,
            from: friendID,
            text: messages[i].text,
            fromUsername: messages[i].fromUsername
          }
          io.to(userID).emit('chat message', msg);
        }
        res.status(200).send('messages sent. I hope you received them');
      } else {
        res.send('could not find the user')
      }
    }
  }); 
};

exports.createUser = function() {
    
};
