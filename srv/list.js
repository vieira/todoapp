function List(username) {
    this.items = [];
    this.users = [username];
}

List.prototype.hasItems = function() {
    return this.items.length > 0;
}

List.prototype.addItem = function(item) {
    this.items.unshift(item);
}

List.prototype.removeItem = function(item) {
    var index = this.items.indexOf(item);
    if (index != -1) {
        this.items.splice(index, 1);
    }
}

List.prototype.addUsername = function(username) {
    this.users.unshift(username);
}

List.prototype.removeUsername = function(username) {
    var index = this.users.indexOf(username);
    if (index != -1) {
        this.users.splice(index, 1);
    }
}

module.exports = List;
