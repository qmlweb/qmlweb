function QMLTranslate(meta) {
    QMLBaseObject.call(this, meta);

    createSimpleProperty("real", this, "x");
    createSimpleProperty("real", this, "y");

    this.xChanged.connect(this.$parent, this.$parent.$updateTransform);
    this.yChanged.connect(this.$parent, this.$parent.$updateTransform);

    this.x = 0;
    this.y = 0;
}

registerQmlType('Translate', QMLTranslate);
