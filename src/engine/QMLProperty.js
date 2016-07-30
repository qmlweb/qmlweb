class QMLProperty {
  constructor(type, obj, name) {
    this.obj = obj;
    this.name = name;
    this.changed = Signal.signal([], { obj });
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
      if (!this.binding.eval) {
        this.binding.compile();
      }
      this.val = this.binding.eval(this.objectScope, this.componentScope);
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
        QmlWeb.engine.operationState !== QMLOperationState.Init) {
      this.update();
    }

    // If this call to the getter is due to a property that is dependant on this
    // one, we need it to take track of changes
    if (QMLProperty.evaluatingProperty &&
        !this.changed.isConnected(
          QMLProperty.evaluatingProperty,
          QMLProperty.prototype.update
        )) {
      // console.log( this,QMLProperty.evaluatingPropertyStack.slice(0),this.val );
      this.changed.connect(QMLProperty.evaluatingProperty, QMLProperty.prototype.update);
    }

    if (this.val && this.val.$get) {
      return this.val.$get();
    }

    return this.val;
  }
  // Define setter
  set(newVal, reason, objectScope, componentScope) {
    const oldVal = this.val;

    let val = newVal;
    if (val instanceof QMLBinding) {
      if (!objectScope || !componentScope) {
        throw new Error("Internal error: binding assigned without scope");
      }
      this.binding = val;
      this.objectScope = objectScope;
      this.componentScope = componentScope;

      if (QmlWeb.engine.operationState !== QMLOperationState.Init) {
        if (!val.eval) {
          val.compile();
        }
        try {
          QMLProperty.pushEvaluatingProperty(this);
          this.needsUpdate = false;
          val = this.binding.eval(objectScope, componentScope);
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

    if (constructors[this.type] === QMLList) {
      this.val = QmlWeb.qmlList({
        object: val,
        parent: this.obj,
        context: componentScope
      });
    } else if (val instanceof QMLMetaElement) {
      const QMLComponent = getConstructor("QtQml", "2.0", "Component");
      if (constructors[val.$class] === QMLComponent ||
          constructors[this.type] === QMLComponent) {
        this.val = new QMLComponent({
          object: val,
          parent: this.obj,
          context: componentScope
        });
      } else {
        this.val = construct({
          object: val,
          parent: this.obj,
          context: componentScope
        });
      }
    } else if (val instanceof Object || !val) {
      this.val = val;
    } else if (constructors[this.type].plainType) {
      this.val = constructors[this.type](val);
    } else {
      this.val = new constructors[this.type](val);
    }

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
