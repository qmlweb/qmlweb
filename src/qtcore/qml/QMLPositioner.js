function QMLPositioner(meta) {
    QMLItem.call(this, meta);

    createProperty({ type: "int", object: this, name: "spacing", initalValue: 0 });
    this.spacingChanged.connect(this, this.layoutChildren);
    this.childrenChanged.connect(this, this.layoutChildren);
    this.childrenChanged.connect(this, QMLPositioner.slotChildrenChanged);

    this.layoutChildren();
}
inherit(QMLPositioner, QMLItem);

QMLPositioner.slotChildrenChanged = function() {
    for (var i = 0; i < this.children.length; i++) {
        var child = this.children[i];
        if (!child.widthChanged.isConnected(this, this.layoutChildren))
            child.widthChanged.connect(this, this.layoutChildren);
        if (!child.heightChanged.isConnected(this, this.layoutChildren))
            child.heightChanged.connect(this, this.layoutChildren);
        if (!child.visibleChanged.isConnected(this, this.layoutChildren))
            child.visibleChanged.connect(this, this.layoutChildren);
        if (!child.opacityChanged.isConnected(this, this.layoutChildren))
            child.opacityChanged.connect(this, this.layoutChildren);
    }
}

