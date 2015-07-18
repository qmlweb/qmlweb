(function (global) {
    Function.prototype.bind = (function () {}).bind || function (b) {
        if (typeof this !== "function") {
            throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
        }

        function C() {}
        var a = [].slice,
            f = a.call(arguments, 1),
            e = this,
            d = function () {
                return e.apply(this instanceof C ? this : b || window, f.concat(a.call(arguments)));
            };
        C.prototype = this.prototype;
        d.prototype = new C();
        return d;
    };
