var path = require("path");
var fs = require("fs");
var vm = require("vm");

var UglifyJS = vm.createContext({
    console       : console,
    process       : process,
    Buffer        : Buffer,
});

function load_global(file) {
    file = path.resolve(path.dirname(module.filename), file);
    try {
        var code = fs.readFileSync(file, "utf8");
        return vm.runInContext(code, UglifyJS, file);
    } catch(ex) {
        // XXX: in case of a syntax error, the message is kinda
        // useless. (no location information).
        console.log("ERROR in file: " + file + " / " + ex);
        process.exit(1);
    }
};

var FILES = exports.FILES = [
    "./utils.js",
    "./ast.js",
    "./parse.js"
].map(function(file){
    return fs.realpathSync(path.join(path.dirname(__filename), file));
});

FILES.forEach(load_global);

// XXX: perhaps we shouldn't export everything but heck, I'm lazy.
for (var i in UglifyJS) {
    if (UglifyJS.hasOwnProperty(i)) {
        exports[i] = UglifyJS[i];
    }
}
