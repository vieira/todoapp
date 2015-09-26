function User(connection) {
    var connections = []
    this.lists = {};
    this.connections = function() {
        return connections;
    }
    if (connection) this.addConnection(connection);
}

User.prototype.isConnected = function() {
    return this.connections().length > 0;
}

User.prototype.addConnection = function(connection) {
    this.connections().unshift(connection);
}

User.prototype.removeConnection = function(connection) {
    var index = this.connections().indexOf(connection);
    if (index != -1) {
        this.connections().splice(index, 1);
    }
}

User.prototype.getList = function() {
    return this.lists;
}

User.prototype.addList = function(name, list) {
    this.lists[name] = list;
}

User.prototype.removeList = function(name) {
    delete this.lists[name];
}

User.prototype.sendTo = function(message, connection) {
    connection.send(JSON.stringify(message));
}

User.prototype.send = function(message, originatingConnection) {
    var numConnections = this.connections().length;
    for (var i = 0; i < numConnections; ++i) {
        if (this.connections()[i] === originatingConnection) continue;
        this.connections()[i].send(JSON.stringify(message));
    }
}

module.exports = User;
