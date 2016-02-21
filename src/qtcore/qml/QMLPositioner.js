function QMLPositioner(meta) {
    QMLItem.call(this, meta);

    createSimpleProperty("int", this, "spacing");
    this.spacingChanged.connect(this, this.layoutChildren);
    this.childrenChanged.connect(this, this.layoutChildren);
    this.childrenChanged.connect(this, QMLPositioner.slotChildrenChanged);

    this.spacing = 0;
}

QMLPositioner.slotChildrenChanged = function() {
    for (var i = 0; i < this.children.length; i++) {
        var child = this.children[i];
        if (!child.widthChanged.isConnected(this, this.layoutChildren))
            child.widthChanged.connect(this, this.layoutChildren);
        if (!child.heightChanged.isConnected(this, this.layoutChildren))
            child.heightChanged.connect(this, this.layoutChildren);
        if (!child.implicitWidthChanged.isConnected(this, this.layoutChildren))
            child.implicitWidthChanged.connect(this, this.layoutChildren);
        if (!child.implicitHeightChanged.isConnected(this, this.layoutChildren))
            child.implicitHeightChanged.connect(this, this.layoutChildren);
        if (!child.visibleChanged.isConnected(this, this.layoutChildren))
            child.visibleChanged.connect(this, this.layoutChildren);
    }
}

