function QMLProperty(type, obj, name) {
    this.obj = obj;
    this.name = name;
    this.changed = Signal([], {obj:obj});
    this.binding = null;
    this.objectScope = null;
    this.componentScope = null;
    this.value = undefined;
    this.type = type;
    this.animation = null;
    this.needsUpdate = true;

    // This list contains all signals that hold references to this object.
    // It is needed when deleting, as we need to tidy up all references to this object.
    this.$tidyupList = [];
}

QMLProperty.ReasonUser = 0;
QMLProperty.ReasonInit = 1;
QMLProperty.ReasonAnimation = 2;

function pushEvalStack() {
  evaluatingPropertyStackOfStacks.push( evaluatingPropertyStack );
  evaluatingPropertyStack = [];
  evaluatingProperty = undefined;
//  console.log("evaluatingProperty=>undefined due to push stck ");
}

function popEvalStack() {
  evaluatingPropertyStack = evaluatingPropertyStackOfStacks.pop() || [];
  evaluatingProperty = evaluatingPropertyStack[ evaluatingPropertyStack.length-1 ];
}

function pushEvaluatingProperty( prop ) {
    // TODO say warnings if already on stack. This means binding loop. BTW actually we do not loop because needsUpdate flag is reset before entering update again.
    if (evaluatingPropertyStack.indexOf( prop ) >= 0) {
      console.error("Property binding loop detected for property ",prop.name, [prop].slice(0));
    }
    evaluatingProperty = prop;
    evaluatingPropertyStack.push( prop ); //keep stack of props
}

function popEvaluatingProperty() {

    evaluatingPropertyStack.pop();
    evaluatingProperty = evaluatingPropertyStack[ evaluatingPropertyStack.length-1 ];
}

// Updater recalculates the value of a property if one of the
// dependencies changed
QMLProperty.prototype.update = function() {
    this.needsUpdate = false;

    if (!this.binding)
        return;

    var oldVal = this.val;

    try {
      pushEvaluatingProperty(this);
      if (!this.binding.eval)
        this.binding.compile();
      this.val = this.binding.eval(this.objectScope, this.componentScope);
    } catch (e) {
      console.log("QMLProperty.update binding error:", e, Function.prototype.toString.call(this.binding.eval))
    } finally {
      popEvaluatingProperty();
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

    if (this.val !== oldVal)
        this.changed(this.val, oldVal, this.name);
}

// Define getter
QMLProperty.prototype.get = function() {
    //if (this.needsUpdate && !evaluatingPropertyPaused) {
    if (this.needsUpdate && engine.operationState !== QMLOperationState.Init) {
      this.update();
    }

    // If this call to the getter is due to a property that is dependant on this
    // one, we need it to take track of changes
    if (evaluatingProperty && !this.changed.isConnected(evaluatingProperty, QMLProperty.prototype.update)) {
        // console.log( this,evaluatingPropertyStack.slice(0),this.val );
        this.changed.connect(evaluatingProperty, QMLProperty.prototype.update);
    }

    return this.val;
}

const typeInitialValues = {
  int: 0,
  real: 0,
  double: 0,
  string: '',
  bool: false,
  list: [],
  url: ''
};

// Define setter
QMLProperty.prototype.set = function(newVal, reason, objectScope, componentScope) {
    var i,
        oldVal = this.val;

    if (newVal instanceof QMLBinding) {
        if (!objectScope || !componentScope)
            throw "Internal error: binding assigned without scope";
        this.binding = newVal;
        this.objectScope = objectScope;
        this.componentScope = componentScope;

        if (engine.operationState !== QMLOperationState.Init) {
            if (!newVal.eval)
                newVal.compile();
            try {
              pushEvaluatingProperty(this);

              this.needsUpdate = false;
              newVal = this.binding.eval(objectScope, componentScope);
            } finally {
              popEvaluatingProperty();
            }
        } else {
            engine.bindedProperties.push(this);
            return;
        }
    } else {
        if (reason != QMLProperty.ReasonAnimation)
            this.binding = null;
        if (newVal instanceof Array)
            newVal = newVal.slice(); // Copies the array
    }

    if (reason === QMLProperty.ReasonInit && typeof newVal === 'undefined') {
      if (typeInitialValues.hasOwnProperty(this.type)) {
        newVal = typeInitialValues[this.type];
      }
    }

    if (constructors[this.type] == QMLList) {
        this.val = QMLList({ object: newVal, parent: this.obj, context: componentScope });
    } else if (newVal instanceof QMLMetaElement) {
        if (constructors[newVal.$class] == QMLComponent || constructors[this.type] == QMLComponent)
            this.val = new QMLComponent({ object: newVal, parent: this.obj, context: componentScope });
        else
            this.val = construct({ object: newVal, parent: this.obj, context: componentScope });
    } else if (newVal instanceof Object || !newVal) {
        this.val = newVal;
    } else {
        this.val = constructors[this.type](newVal);
    }

    if (this.val !== oldVal) {
        if (this.animation && reason == QMLProperty.ReasonUser) {
            this.animation.running = false;
            this.animation.$actions = [{
                target: this.animation.target || this.obj,
                property: this.animation.property || this.name,
                from: this.animation.from || oldVal,
                to: this.animation.to || this.val
            }];
            this.animation.running = true;
        }
        if (this.obj.$syncPropertyToRemote instanceof Function && reason == QMLProperty.ReasonUser) { // is a remote object from e.g. a QWebChannel
            this.obj.$syncPropertyToRemote(this.name, newVal);
        } else {
            this.changed(this.val, oldVal, this.name);
        }
    }
}


