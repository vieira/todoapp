function NoLog() {
    NoLog.prototype.success = function(message) {}
    NoLog.prototype.error = function(message) {}
    NoLog.prototype.print = function(message) {}
}

module.exports = NoLog;
