class QMLBinding {
/**
 * Create QML binding.
 * @param {Variant} val Sourcecode or function representing the binding
 * @param {Array} tree Parser tree of the binding
 * @return {Object} Object representing the binding
 */
  constructor(val, tree) {
    // this.isFunction states whether the binding is a simple js statement or a
    // function containing a return statement. We decide this on whether it is a
    // code block or not. If it is, we require a return statement. If it is a
    // code block it could though also be a object definition, so we need to
    // check that as well (it is, if the content is labels).
    this.isFunction = tree && tree[0] === "block" &&
                      tree[1][0] && tree[1][0][0] !== "label";
    this.src = val;
  }

  toJSON() {
    return {
      src: this.src,
      deps: JSON.stringify(this.deps),
      tree: JSON.stringify(this.tree)
    };
  }

/**
 * Compile binding. Afterwards you may call binding.eval to evaluate.
 */
  compile() {
    this.eval = new Function("__executionObject", "__executionContext",
      "__basePath", `
      QmlWeb.executionContext = __executionContext;
      if (__basePath) {
        QmlWeb.engine.$basePath = __basePath;
      }
      with(QmlWeb) with(__executionContext) with(__executionObject) {
        ${this.isFunction ? "" : "return"} ${this.src}
        }
    `);
  }
}

QmlWeb.QMLBinding = QMLBinding;
