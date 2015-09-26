function Item(name) {
    this.name = name;
    this.done = false;
    this.timestamp = Date.now();
}

Item.prototype.isDone = function() {
    return this.done;
}

Item.prototype.setDone = function(done) {
    this.done = done;
    this.timestamp = Date.now();
}

Item.prototype.getTimestamp = function() {
    return this.timestamp;
}

module.exports = Item;
