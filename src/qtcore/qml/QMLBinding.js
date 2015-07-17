/**
 *
 * QML binding functions
 *
 */

/**
 * Create QML binding.
 *
 * @param   val     sourcecode or function representing the binding
 * @param   tree    parser tree of the binding
 *
 * @return  object representing the binding
 *
 */
global.QMLBinding = function (val, tree) {
    this.function = tree && tree[0] == "block" && tree[1][0] && tree[1][0][0] !== "label";
    this.src = val;
}

global.QMLBinding.prototype.toJSON = function () {
    return {
        src: this.src,
        deps: JSON.stringify(this.deps),
        tree: JSON.stringify(this.tree)
    };
}

/**
 *
 * Compile binding.
 * Afterwards you may call binding.eval to evaluate.
 *
 */
global.QMLBinding.prototype.compile = function () {
    var bindSrc = this.function ? "(function(o, c) { with(c) with(o) " + this.src + "})" : "(function(o, c) { with(c) with(o) return " + this.src + "})";
    this.eval = eval(bindSrc);
}
