function Log(out) {
    this.out = out;
    this.colors = {
        Gray: '\033[0;30m',
        Red: '\033[1;31m',
        Green: '\033[1;32m',
        Default: '\033[0;39m'
    }

    Log.prototype.success = function(message) {
        out.log(this.colors.Green + "> " + this.colors.Default + message);
    }

    Log.prototype.error = function(message) {
        out.error(this.colors.Red + "X " + this.colors.Default + message);
    }

    Log.prototype.print = function(message) {
        out.log(this.colors.Gray + "= " + this.colors.Default + message);
    }
}

module.exports = Log;
