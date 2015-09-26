var express = require('express'),
    bodyParser = require('body-parser'),
    crypto = require('crypto'),
    app = express();

function Reqs() {}

Reqs.prototype.setUsers = function(users) {
    this.users = users;
}

Reqs.prototype.setHandlers = function() {
    app.use(bodyParser());
    app.post('/login', function(req, res, next) {
        var username = req.body.username;
        var password = req.body.password;
        if (username in this.users && 
            this.users[username].password === password) {
                user = this.users[username];
                if (user.token) {
                    res.send(user.token);
                } else {
                    crypto.randomBytes(16, function(err, buf) {
                        if (err) throw err;
                        user.token = buf.toString('hex');
                        res.send(user.token);
                    });
                }
            } else {
                res.send(401);
            }
    }.bind(this));
    app.use(express.static(__dirname + '/../clt',  { maxAge: 86400000 }));
    return app;
}

module.exports = Reqs;
