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
    this.compiled = false;
  }

  toJSON() {
    return {
      src: this.src,
      deps: JSON.stringify(this.deps),
      tree: JSON.stringify(this.tree)
    };
  }

  eval(object, context, basePath) {
    QmlWeb.executionContext = context;
    if (basePath) {
      QmlWeb.engine.$basePath = basePath;
    }
    // .call is needed for `this` support
    return this.impl.call(object, object, context);
  }

  /**
  * Compile binding. Afterwards you may call binding.eval to evaluate.
  */
  compile() {
    this.src = this.src.trim();
    this.impl = QMLBinding.bindSrc(this.src, this.isFunction);
    this.compiled = true;
  }

  static bindSrc(src, isFunction) {
    return new Function("__executionObject", "__executionContext", `
      with(QmlWeb) with(__executionContext) with(__executionObject) {
        ${isFunction ? "" : "return"} ${src}
      }
    `);
  }
}

QmlWeb.QMLBinding = QMLBinding;
