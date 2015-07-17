/**
 * Create QML property
 *
 */

/**
 * Create QML property
 *
 * @param   type    property type
 * @param   obj     object for property
 * @param   name    name of property
 *
 */
function QMLProperty(type, obj, name) {
    this.obj = obj;
    this.name = name;
    this.changed = Signal([], {
        obj: obj
    });
    this.binding = null;
    this.objectScope = null;
    this.componentScope = null;
    this.value = undefined;
    this.type = type;
    this.animation = null;

    this.$tidyupList = [];
}

QMLProperty.prototype.update = function () {
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

QMLProperty.prototype.get = function () {
    if (evaluatingProperty && !this.changed.isConnected(evaluatingProperty, QMLProperty.prototype.update))
        this.changed.connect(evaluatingProperty, QMLProperty.prototype.update);

    return this.val;
}

QMLProperty.prototype.set = function (newVal, fromAnimation, objectScope, componentScope) {
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
            newVal = newVal.slice();
    }

    if (constructors[this.type] == QMLList) {
        this.val = QMLList({
            object: newVal,
            parent: this.obj,
            context: componentScope
        });
    } else if (newVal instanceof QMLMetaElement) {
        if (constructors[newVal.$class] == QMLComponent || constructors[this.type] == QMLComponent)
            this.val = new QMLComponent({
                object: newVal,
                parent: this.obj,
                context: componentScope
            });
        else
            this.val = construct({
                object: newVal,
                parent: this.obj,
                context: componentScope
            });
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
        this.changed(this.val, oldVal, this.name);
    }
}
