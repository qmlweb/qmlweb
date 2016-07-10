class QMLProperty {
  constructor(type, obj, name) {
    this.obj = obj;
    this.name = name;
    this.changed = QmlWeb.Signal.signal([], { obj });
    this.binding = null;
    this.objectScope = null;
    this.componentScope = null;
    this.value = undefined;
    this.type = type;
    this.animation = null;
    this.needsUpdate = true;

    // This list contains all signals that hold references to this object.
    // It is needed when deleting, as we need to tidy up all references to this
    // object.
    this.$tidyupList = [];
  }

  // Called by update and set to actually set this.val, performing any type
  // conversion required.
  $setVal(val, componentScope) {
    const constructors = QmlWeb.constructors;
    if (constructors[this.type] === QmlWeb.qmlList) {
      this.val = QmlWeb.qmlList({
        object: val,
        parent: this.obj,
        context: componentScope
      });
    } else if (val instanceof QmlWeb.QMLMetaElement) {
      const QMLComponent = QmlWeb.getConstructor("QtQml", "2.0", "Component");
      if (constructors[val.$class] === QMLComponent ||
          constructors[this.type] === QMLComponent) {
        this.val = new QMLComponent({
          object: val,
          parent: this.obj,
          context: componentScope
        });
        /* $basePath must be set here so that Components that are assigned to
         * properties (e.g. Repeater delegates) can properly resolve child
         * Components that live in the same directory in
         * Component.createObject. */
        this.val.$basePath = componentScope.$basePath;
      } else {
        this.val = QmlWeb.construct({
          object: val,
          parent: this.obj,
          context: componentScope
        });
      }
    } else if (!constructors[this.type]) {
      this.val = val;
    } else if (constructors[this.type].requireParent) {
      this.val = new constructors[this.type](this.obj, val);
    } else if (val === undefined && constructors[this.type].nonNullableType) {
      this.val = new constructors[this.type]();
    } else if (constructors[this.type].requireConstructor) {
      this.val = new constructors[this.type](val);
    } else if (val instanceof Object || val === undefined || val === null) {
      this.val = val;
    } else if (constructors[this.type].plainType) {
      this.val = constructors[this.type](val);
    } else {
      this.val = new constructors[this.type](val);
    }
    if (this.val && this.val.$changed) {
      this.val.$changed.connect(() => {
        const oldVal = this.val; // TODO
        this.changed(this.val, oldVal, this.name);
      });
    } else if (this.val && this.val.$properties) {
      Object.keys(this.val.$properties).forEach(pname => {
        const prop = this.val.$properties[pname];
        if (!prop || !prop.connect) return;
        // TODO: oldVal
        prop.connect(() => this.changed(this.val, this.val, this.name));
      });
    }
  }

  // Updater recalculates the value of a property if one of the dependencies
  // changed
  update() {
    this.needsUpdate = false;

    if (!this.binding) {
      return;
    }

    const oldVal = this.val;

    try {
      QMLProperty.pushEvaluatingProperty(this);
      if (!this.binding.compiled) {
        this.binding.compile();
      }
      this.$setVal(this.binding.eval(this.objectScope, this.componentScope,
        this.componentScopeBasePath), this.componentScope);
    } catch (e) {
      console.log("QMLProperty.update binding error:",
        e,
        Function.prototype.toString.call(this.binding.eval)
      );
    } finally {
      QMLProperty.popEvaluatingProperty();
    }

    if (this.animation) {
      this.animation.$actions = [{
        target: this.animation.target || this.obj,
        property: this.animation.property || this.name,
        from: this.animation.from || oldVal,
        to: this.animation.to || this.val
      }];
      this.animation.restart();
    }

    if (this.val !== oldVal) {
      this.changed(this.val, oldVal, this.name);
    }
  }

  // Define getter
  get() {
    //if (this.needsUpdate && !QMLProperty.evaluatingPropertyPaused) {
    if (this.needsUpdate &&
        QmlWeb.engine.operationState !== QmlWeb.QMLOperationState.Init) {
      this.update();
    }

    // If this call to the getter is due to a property that is dependant on this
    // one, we need it to take track of changes
    if (QMLProperty.evaluatingProperty) {
      //console.log(this,QMLProperty.evaluatingPropertyStack.slice(0),this.val);
      this.changed.connect(
        QMLProperty.evaluatingProperty,
        QMLProperty.prototype.update,
        QmlWeb.Signal.UniqueConnection
      );
    }

    return this.val;
  }
  // Define setter
  set(newVal, reason, objectScope, componentScope) {
    const oldVal = this.val;

    let val = newVal;
    if (val instanceof QmlWeb.QMLBinding) {
      if (!objectScope || !componentScope) {
        throw new Error("Internal error: binding assigned without scope");
      }
      this.binding = val;
      this.objectScope = objectScope;
      this.componentScope = componentScope;
      this.componentScopeBasePath = componentScope.$basePath;

      if (QmlWeb.engine.operationState !== QmlWeb.QMLOperationState.Init) {
        if (!val.compiled) {
          val.compile();
        }
        try {
          QMLProperty.pushEvaluatingProperty(this);
          this.needsUpdate = false;
          val = this.binding.eval(objectScope, componentScope,
            this.componentScopeBasePath);
        } finally {
          QMLProperty.popEvaluatingProperty();
        }
      } else {
        QmlWeb.engine.bindedProperties.push(this);
        return;
      }
    } else {
      if (reason !== QMLProperty.ReasonAnimation) {
        this.binding = null;
      }
      if (val instanceof Array) {
        val = val.slice(); // Copies the array
      }
    }

    if (reason === QMLProperty.ReasonInit && typeof val === "undefined") {
      if (QMLProperty.typeInitialValues.hasOwnProperty(this.type)) {
        val = QMLProperty.typeInitialValues[this.type];
      }
    }

    this.$setVal(val, componentScope);

    if (this.val !== oldVal) {
      if (this.animation && reason === QMLProperty.ReasonUser) {
        this.animation.running = false;
        this.animation.$actions = [{
          target: this.animation.target || this.obj,
          property: this.animation.property || this.name,
          from: this.animation.from || oldVal,
          to: this.animation.to || this.val
        }];
        this.animation.running = true;
      }
      if (this.obj.$syncPropertyToRemote instanceof Function &&
          reason === QMLProperty.ReasonUser) {
        // is a remote object from e.g. a QWebChannel
        this.obj.$syncPropertyToRemote(this.name, val);
      } else {
        this.changed(this.val, oldVal, this.name);
      }
    }
  }

  static pushEvalStack() {
    QMLProperty.evaluatingPropertyStackOfStacks.push(
      QMLProperty.evaluatingPropertyStack
    );
    QMLProperty.evaluatingPropertyStack = [];
    QMLProperty.evaluatingProperty = undefined;
  //  console.log("evaluatingProperty=>undefined due to push stck ");
  }

  static popEvalStack() {
    QMLProperty.evaluatingPropertyStack =
      QMLProperty.evaluatingPropertyStackOfStacks.pop() || [];
    QMLProperty.evaluatingProperty =
      QMLProperty.evaluatingPropertyStack[
        QMLProperty.evaluatingPropertyStack.length - 1
      ];
  }

  static pushEvaluatingProperty(prop) {
    // TODO say warnings if already on stack. This means binding loop.
    // BTW actually we do not loop because needsUpdate flag is reset before
    // entering update again.
    if (QMLProperty.evaluatingPropertyStack.indexOf(prop) >= 0) {
      console.error("Property binding loop detected for property",
        prop.name,
        [prop].slice(0)
      );
    }
    QMLProperty.evaluatingProperty = prop;
    QMLProperty.evaluatingPropertyStack.push(prop); //keep stack of props
  }

  static popEvaluatingProperty() {
    QMLProperty.evaluatingPropertyStack.pop();
    QMLProperty.evaluatingProperty = QMLProperty.evaluatingPropertyStack[
      QMLProperty.evaluatingPropertyStack.length - 1
    ];
  }
}

// Property that is currently beeing evaluated. Used to get the information
// which property called the getter of a certain other property for
// evaluation and is thus dependant on it.
QMLProperty.evaluatingProperty = undefined;
QMLProperty.evaluatingPropertyPaused = false;
QMLProperty.evaluatingPropertyStack = [];
QMLProperty.evaluatingPropertyStackOfStacks = [];

QMLProperty.typeInitialValues = {
  int: 0,
  real: 0,
  double: 0,
  string: "",
  bool: false,
  list: [],
  enum: 0,
  url: ""
};

QMLProperty.ReasonUser = 0;
QMLProperty.ReasonInit = 1;
QMLProperty.ReasonAnimation = 2;

QmlWeb.QMLProperty = QMLProperty;
