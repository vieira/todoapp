var Log = require('./log'), 
    User = require('./user'),
    List = require('./list'),
    Reqs = require('./reqs'),
    WebSocketServer = require('ws').Server,
    http = require('http');


function TodoServer(server, logger) {
    this.users = {};
    this.log = logger;
    this.socket = new WebSocketServer({server: server, clientTracking: false});
    this.socket.on('connection', this.handleConnection.bind(this));
}

TodoServer.prototype.handleConnection = function(connection) {
    this.log.success('new connection');
    connection.on('message', this.handleMessage.bind(this, connection));
    connection.on('close', this.handleClose.bind(this, connection));
}

TodoServer.prototype.handleMessage = function(connection, message) {
    var message = JSON.parse(message);

    switch (message.cmd) {
        case "login-user":
            this.handleLoginUser(connection, message);
            break;
        case "get-list":
            this.handleGetList(connection, message);
            break;
        case "add-list":
            this.handleAddList(connection, message);
            break;
        case "share-list":
            this.handleShareList(connection, message);
            break;
        case "remove-list":
            this.handleRemoveList(connection, message);
            break;
        case "add-item":
            this.handleAddItem(connection, message);
            break;
        case "remove-item":
            this.handleRemoveItem(connection, message);
            break;
/*      case "mark-item":
            this.handleMarkItem(connection, message);
            break;
*/
    }
}

TodoServer.prototype.handleLoginUser = function(connection, message) {
    username = message.username;
    token = message.token;
    
    if (username in this.users && this.users[username].token === token) {
        user = this.users[username];
        user.addConnection(connection);
        connection.username = username;
        this.log.success("user identified as " + username);
        this.log.print(Object.keys(this.users).length + " users connected");
    } else {
        this.log.error("Invalid token " + token + " for user " + username);
        connection.close();
        //this.users[username] = new User(connection);
    }

}

TodoServer.prototype.handleGetList = function(connection, message) {
    if (!this.isLoggedIn(connection)) return;
    user = this.users[connection.username];
    user.sendTo(user.getList(), connection);
    this.log.print("Requested lists for " + connection.username);
}

TodoServer.prototype.handleAddList = function(connection, message) {
    if (!this.isLoggedIn(connection)) return;
    user = this.users[connection.username];
    user.addList(message.name, new List(connection.username));
    user.send(user.getList(), connection);
}

TodoServer.prototype.handleShareList = function(connection, message) {
    if (!this.isLoggedIn(connection)) return;
    user = this.users[connection.username];
    if (!(message.name in user.lists)) return;
    list = user.lists[message.name];
    if (!(message.username in this.users)) return;
    user = this.users[message.username];
    user.addList(message.name, list);
    list.addUsername(message.username);
    user.send(user.getList());
}

TodoServer.prototype.handleRemoveList = function(connection, message) {
    if (!this.isLoggedIn(connection)) return;
    user = this.users[connection.username];
    if (!(message.name in user.lists)) return;
    list = user.lists[message.name];
    numListUsers = list.users.length;
    for (var i = 0; i < numListUsers; ++i) {
        username = list.users[i];
        this.log.print("Removing from " + username)
        this.users[username].removeList(message.name);
        this.users[username].send(this.users[username].getList(), connection);
    }
}

TodoServer.prototype.handleAddItem = function(connection, message) {
    if (!this.isLoggedIn(connection)) return;
    user = this.users[connection.username];
    if (!(message.name in user.lists)) return;
    list = user.lists[message.name];
    list.addItem(message.item);
    numListUsers = list.users.length;
    for (var i = 0; i < numListUsers; ++i) {
        username = list.users[i];
        this.log.print("Sending items to " + username)
        this.users[username].send(this.users[username].getList(), connection);
    }
}

TodoServer.prototype.handleRemoveItem = function(connection, message) {
    if (!this.isLoggedIn(connection)) return;
    user = this.users[connection.username];
    if (!(message.name in user.lists)) return;
    list = user.lists[message.name];
    list.removeItem(message.item);
    numListUsers = list.users.length;
    for (var i = 0; i < numListUsers; ++i) {
        username = list.users[i];
        this.log.print("Sending items to " + username)
        this.users[username].send(this.users[username].getList(), connection);
    }
}
 
 
TodoServer.prototype.handleClose = function(connection) {
    if (this.isLoggedIn(connection)) {
        user = this.users[connection.username];
        user.removeConnection(connection);
        this.log.success("removing connection from " + connection.username);
    }

    this.log.success("connection closed");
    this.log.print(Object.keys(this.users).length + " users in the system");
}

TodoServer.prototype.isLoggedIn = function(connection) {
    if (connection.hasOwnProperty('username')) {
        return true;
    } else {
        this.log.error("log in first");
        return false;
    }
}

Function.prototype.bind = function(object) {
    var fn = this, args = Array.prototype.slice.call(arguments, 1);
    return function() {
        return fn.apply(object, // bind to object and curry
                args.concat(Array.prototype.slice.call(arguments)));
    }
}

if (require.main === module) {
    // http reqs
    reqs = new Reqs();
    app = reqs.setHandlers();

    var server = http.createServer(app);
    server.listen(8000);
    todo = new TodoServer(server, new Log(console));
    
    // open db
    var users = require("../db.json");
    for (user in users) {
        if (!(user in todo.users)) todo.users[user] = new User();
        for (list in users[user].lists) {
            if (list in todo.users[user].lists) continue;
            todo.users[user].addList(list, new List());
            todo.users[user].lists[list].items = users[user].lists[list].items;
            todo.users[user].lists[list].users = users[user].lists[list].users;
            var owners = users[user].lists[list].users;
            for (var i = 0; i < owners.length; ++i) {
                if (owners[i] === user) continue;
                if (!(owners[i] in todo.users))
                    todo.users[owners[i]] = new User();
                todo.users[owners[i]].lists[list] = 
                    todo.users[user].lists[list];
            }
        }
        todo.users[user]['password'] = users[user].password;
        todo.users[user]['token'] = users[user].token;
    }

    reqs.setUsers(todo.users);

    // save db on exit
    process.on('SIGINT', function() {
        console.log(" saving data to file");
        var fs = require('fs');
        fs.writeFileSync("db.json", JSON.stringify(todo.users));
        process.exit();
    });
} else module.exports = TodoServer;
