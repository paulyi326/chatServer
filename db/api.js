var mongojs = require('mongojs');
var chatUrl = process.env.chatUrl || 'chat';
var db = mongojs(chatUrl, ['users']);

exports.saveMessage = function(msg) {
    console.log(msg);

    db.users.findOne({
        id: msg.to
    }, function(err, user) {
        if (err) {
            console.log('error in finding user');
        } else {
            if (user) {
                // if this is first msg sent to this person, msg array needs to be created
                user.messages[msg.from] = user.messages[msg.from] || [];
                
                user.messages[msg.from].push(msg.text);
                console.log('message saved in db');
            } else {
                console.log('user could not be found');
            }
        }
    });
};

exports.getMessages = function(req, res, io) {
    // the ids come in on the req.query obj as a string for some reason
    // '+' operator converts to number
    var userID = +req.query.userID;
    var friendID = +req.query.friendID;

    // for reasons I do not understand, if there is any uncaught
    // error in here, it shows as a CORS error on the client side
    db.users.findOne({
        id: userID
    }, function(err, user) {
        if (err) {
            res.status(404).send({ err: err, msg: 'error trying to find user' });
        } else {
            if (user) {
                var messages = user.messages[friendID];
                for (var i = 0; i < messages.length; i++) {
                    var msg = {
                        to: userID,
                        from: friendID,
                        text: messages[i]
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

exports.createDummyUser = function() {
    db.users.insert({ 
        id: 7, 
        friendIds: [1, 2, 3, 4, 5, 6], 
        messages: {
            1: ['hey kobe', 'hey paul']
        }
    }, function(err, value) {
        if (err) {
            console.log('err', err);
        } else {
            console.log('value', value);
        }
    });
}


