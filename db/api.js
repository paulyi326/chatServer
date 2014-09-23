var mongojs = require('mongojs');
var chatUrl = process.env.chatUrl || 'chat';
var db = mongojs(chatUrl, ['users']);

exports.saveMessage = function(msg) {
    db.users.findOne({
        id: msg.to
    }, function(err, user) {
        if (err) {
            res.status(404).send({ err: err, msg: 'user not found' });
        } else {
            user.messages[msg.from].push(msg.text);
            console.log('message saved in db');
        }
    });
};

exports.getMessages = function(req, res, io) {
    db.users.findOne({
        id: req.query.userID
    }, function(err, user) {
        if (err) {
            res.status(404).send({ err: err, msg: 'user not found' });
        } else {
            var messages = user.messages[req.query.friendID];
            for (var i = 0; i < messages.length; i++) {
                var msg = {
                    to: req.query.userID,
                    from: req.query.friendID,
                    text: messages[i]
                }
                io.to(user.id).emit('chat message', msg);
            }
            res.status(200).send('messages sent. I hope you received them');
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


