function QMLProperty(type, obj, name) {
    this.obj = obj;
    this.name = name;
    this.changed = Signal([], {obj:obj});
    this.binding = null;
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

    var oldVal = this.value;
    evaluatingProperty = this;
    this.value = this.binding.eval();
    evaluatingProperty = undefined;

    if (this.animation) {
        this.animation.$actions = [{
            target: this.animation.target || this.obj,
            property: this.animation.property || this.name,
            from: this.animation.from || oldVal,
            to: this.animation.to || this.value
        }];
        this.animation.restart();
    }

    if (this.value !== oldVal)
        this.changed(this.value, oldVal, this.name);
}

// Define getter
QMLProperty.prototype.get = function() {
    // If this call to the getter is due to a property that is dependant on this
    // one, we need it to take track of changes
    if (evaluatingProperty && !this.changed.isConnected(evaluatingProperty, QMLProperty.prototype.update))
        this.changed.connect(evaluatingProperty, QMLProperty.prototype.update);

    return this.value;
}

// Define setter
QMLProperty.prototype.set = function(newVal, fromAnimation, objectScope, context) {
    var i,
        oldVal = this.value;

    if (newVal instanceof QMLBinding) {
        this.binding = newVal;

        if (!newVal.eval)
            newVal.compile(objectScope, context);

        if (qmlEngine.operationState !== QMLOperationState.Init) {
            evaluatingProperty = this;
            newVal = this.binding.eval();
            evaluatingProperty = null;
        } else {
            qmlEngine.bindedProperties.push(this);
            return;
        }
    } else {
        if (!fromAnimation)
            this.binding = null;
        if (newVal instanceof Array)
            newVal = newVal.slice(); // Copies the array
    }

    if (constructors[this.type] == QMLList) {
        this.value = QMLList({ object: newVal, parent: this.obj, context: context});
    } else if (newVal instanceof QMLMetaElement) {
        this.value = construct({ object: newVal, parent: this.obj, context: context});
    } else if (newVal instanceof Object || !newVal) {
        this.value = newVal;
    } else {
        this.value = new constructors[this.type](newVal);
    }

    if (this.value !== oldVal) {
        if (this.animation && !fromAnimation) {
            this.animation.running = false;
            this.animation.$actions = [{
                target: this.animation.target || this.obj,
                property: this.animation.property || this.name,
                from: this.animation.from || oldVal,
                to: this.animation.to || this.value
            }];
            this.animation.running = true;
        }
        this.changed(this.value, oldVal, this.name);
    }
}


