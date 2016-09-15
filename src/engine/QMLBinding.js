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
    if (this.impl) {
      // .call is needed for `this` support
      return this.impl.call(object, object, context, basePath);
    }
    if (this.src === "this") {
      return object;
    }

    const path = this.path;
    const varname = path[0];

    QmlWeb.executionContext = context;
    if (basePath) {
      QmlWeb.engine.$basePath = basePath;
    }

    let base;
    if (varname in object) {
      base = object[varname];
    } else if (varname in context) {
      base = context[varname];
    } else if (varname in QmlWeb) {
      base = QmlWeb[varname];
    } else {
      throw new ReferenceError(`${varname} is not defined`);
    }

    for (let i = 1; i < path.length; i++) {
      base = base[path[i]];
    }
    return base;
  }

/**
 * Compile binding. Afterwards you may call binding.eval to evaluate.
 */
  compile() {
    this.src = this.src.trim();
    if (!this.isFunction && /^[a-zA-Z$_][a-zA-Z0-9$_.]*$/.test(this.src)) {
      // A simple variable reference
      this.path = this.src.split(".");
      if (this.path[0] === "this") {
        this.path.shift();
      }
    } else {
      // A complex expression
      this.impl = QMLBinding.bindSrc(this.src, this.isFunction);
    }
    this.compiled = true;
  }

  static bindSrc(src, isFunction) {
    return new Function("__executionObject", "__executionContext",
      "__basePath", `
      QmlWeb.executionContext = __executionContext;
      if (__basePath) {
        QmlWeb.engine.$basePath = __basePath;
      }
      with(QmlWeb) with(__executionContext) with(__executionObject) {
        ${isFunction ? "" : "return"} ${src}
      }
    `);
  }
}

QmlWeb.QMLBinding = QMLBinding;
