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

    // This list contains all signals that hold references to this object.
    // It is needed when deleting, as we need to tidy up all references to this object.
    this.$tidyupList = [];
}

// Updater recalculates the value of a property if one of the
// dependencies changed
QMLProperty.prototype.update = function() {
    if (!this.binding)
        return;

    var oldVal = this.val;
    evaluatingProperty = this;
    this.val = this.binding.eval(this.objectScope, this.componentScope);
    evaluatingProperty = undefined;

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
    // If this call to the getter is due to a property that is dependant on this
    // one, we need it to take track of changes
    if (evaluatingProperty && !this.changed.isConnected(evaluatingProperty, QMLProperty.prototype.update))
        this.changed.connect(evaluatingProperty, QMLProperty.prototype.update);

    return this.val;
}

// Define setter
QMLProperty.prototype.set = function(newVal, fromAnimation, objectScope, componentScope) {
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

            evaluatingProperty = this;
            newVal = this.binding.eval(objectScope, componentScope);
            evaluatingProperty = null;
        } else {
            engine.bindedProperties.push(this);
            return;
        }
    } else {
        if (!fromAnimation)
            this.binding = null;
        if (newVal instanceof Array)
            newVal = newVal.slice(); // Copies the array
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
        if (this.animation && !fromAnimation) {
            this.animation.running = false;
            this.animation.$actions = [{
                target: this.animation.target || this.obj,
                property: this.animation.property || this.name,
                from: this.animation.from || oldVal,
                to: this.animation.to || this.val
            }];
            this.animation.running = true;
        }
        if (this.obj.$syncPropertyToRemote instanceof Function && !fromAnimation) { // is a remote object from e.g. a QWebChannel
            this.obj.$syncPropertyToRemote(this.name, newVal);
        } else {
            this.changed(this.val, oldVal, this.name);
        }
    }
}


