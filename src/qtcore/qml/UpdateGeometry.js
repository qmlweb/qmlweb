function updateHGeometry(newVal, oldVal, propName) {
    var anchors = this.anchors || this;
    if (this.$updatingGeometry)
        return;
    this.$updatingGeometry = true;

    var t, w, width, x, left, hC, right,
        lM = anchors.leftMargin || anchors.margins,
        rM = anchors.rightMargin || anchors.margins;

    // Width
    if (this.$isUsingImplicitWidth && propName == "implicitWidth")
        width = this.implicitWidth;
    else if (propName == "width")
        this.$isUsingImplicitWidth = false;

    // Position TODO: Layouts
    if ((t = anchors.fill) !== undefined) {
        if (!t.$properties.left.changed.isConnected(this, updateHGeometry))
            t.$properties.left.changed.connect(this, updateHGeometry);
        if (!t.$properties.width.changed.isConnected(this, updateHGeometry))
            t.$properties.width.changed.connect(this, updateHGeometry);

        this.$isUsingImplicitWidth = false;
        width = t.width - lM - rM;
        x = t.left - (this.parent ? this.parent.left : 0) + lM;
        left = t.left + lM;
        right = t.right - rM;
        hC = (left + right) / 2;
    } else if ((t = anchors.centerIn) !== undefined) {
        if (!t.$properties.horizontalCenter.changed.isConnected(this, updateHGeometry))
            t.$properties.horizontalCenter.changed.connect(this, updateHGeometry);

        w = width || this.width;
        hC = t.horizontalCenter;
        x = hC - w / 2 - (this.parent ? this.parent.left : 0);
        left = hC - w / 2;
        right = hC + w / 2;
    } else if ((t = anchors.left) !== undefined) {
        left = t + lM
        if ((u = anchors.right) !== undefined) {
            right = u - rM;
            this.$isUsingImplicitWidth = false;
            width = right - left;
            x = left - (this.parent ? this.parent.left : 0);
            hC = (right + left) / 2;
        } else if ((hC = anchors.horizontalCenter) !== undefined) {
            this.$isUsingImplicitWidth = false;
            width = (hC - left) * 2;
            x = left - (this.parent ? this.parent.left : 0);
            right = 2 * hC - left;
        } else {
            w = width || this.width;
            x = left - (this.parent ? this.parent.left : 0);
            right = left + w;
            hC = left + w / 2;
        }
    } else if ((t = anchors.right) !== undefined) {
        right = t - rM;
        if ((hC = anchors.horizontalCenter) !== undefined) {
            this.$isUsingImplicitWidth = false;
            width = (right - hC) * 2;
            x = 2 * hC - right - (this.parent ? this.parent.left : 0);
            left = 2 * hC - right;
        } else {
            w = width || this.width;
            x = right - w - (this.parent ? this.parent.left : 0);
            left = right - w;
            hC = right - w / 2;
        }
    } else if ((hC = anchors.horizontalCenter) !== undefined) {
        w = width || this.width;
        x = hC - w / 2 - (this.parent ? this.parent.left : 0);
        left = hC - w / 2;
        right = hC + w / 2;
    } else {
        if (this.parent && !this.parent.$properties.left.changed.isConnected(this, updateHGeometry))
            this.parent.$properties.left.changed.connect(this, updateHGeometry);

        w = width || this.width;
        left = this.x + (this.parent ? this.parent.left : 0);
        right = left + w;
        hC = left + w / 2;
    }

    if (left !== undefined)
        this.left = left;
    if (hC !== undefined)
        this.horizontalCenter = hC;
    if (right !== undefined)
        this.right = right;
    if (x !== undefined)
        this.x = x;
    if (width !== undefined)
        this.width = width;

    this.$updatingGeometry = false;
    
    if (this.parent != undefined) updateChildrenRect(this.parent);
}

function updateVGeometry(newVal, oldVal, propName) {
    var anchors = this.anchors || this;
    if (this.$updatingGeometry)
        return;
    this.$updatingGeometry = true;

    var t, w, height, y, top, vC, bottom,
        tM = anchors.topMargin || anchors.margins,
        bM = anchors.bottomMargin || anchors.margins;

    // Height
    if (this.$isUsingImplicitHeight && propName == "implicitHeight")
        height = this.implicitHeight;
    else if (propName == "height")
        this.$isUsingImplicitHeight = false;

    // Position TODO: Layouts
    if ((t = anchors.fill) !== undefined) {
        if (!t.$properties.top.changed.isConnected(this, updateVGeometry))
            t.$properties.top.changed.connect(this, updateVGeometry);
        if (!t.$properties.height.changed.isConnected(this, updateVGeometry))
            t.$properties.height.changed.connect(this, updateVGeometry);

        this.$isUsingImplicitHeight = false;
        height = t.height - tM - bM;
        y = t.top - (this.parent ? this.parent.top : 0) + tM;
        top = t.top + tM;
        bottom = t.bottom - bM;
        vC = (top + bottom) / 2;
    } else if ((t = anchors.centerIn) !== undefined) {
        if (!t.$properties.verticalCenter.changed.isConnected(this, updateVGeometry))
            t.$properties.verticalCenter.changed.connect(this, updateVGeometry);

        w = height || this.height;
        vC = t.verticalCenter;
        y = vC - w / 2 - (this.parent ? this.parent.top : 0);
        top = vC - w / 2;
        bottom = vC + w / 2;
    } else if ((t = anchors.top) !== undefined) {
        top = t + tM
        if ((u = anchors.bottom) !== undefined) {
            bottom = u - bM;
            this.$isUsingImplicitHeight = false;
            height = bottom - top;
            y = top - (this.parent ? this.parent.top : 0);
            vC = (bottom + top) / 2;
        } else if ((vC = anchors.verticalCenter) !== undefined) {
            this.$isUsingImplicitHeight = false;
            height = (vC - top) * 2;
            y = top - (this.parent ? this.parent.top : 0);
            bottom = 2 * vC - top;
        } else {
            w = height || this.height;
            y = top - (this.parent ? this.parent.top : 0);
            bottom = top + w;
            vC = top + w / 2;
        }
    } else if ((t = anchors.bottom) !== undefined) {
        bottom = t - bM;
        if ((vC = anchors.verticalCenter) !== undefined) {
            this.$isUsingImplicitHeight = false;
            height = (bottom - vC) * 2;
            y = 2 * vC - bottom - (this.parent ? this.parent.top : 0);
            top = 2 * vC - bottom;
        } else {
            w = height || this.height;
            y = bottom - w - (this.parent ? this.parent.top : 0);
            top = bottom - w;
            vC = bottom - w / 2;
        }
    } else if ((vC = anchors.verticalCenter) !== undefined) {
        w = height || this.height;
        y = vC - w / 2 - (this.parent ? this.parent.top : 0);
        top = vC - w / 2;
        bottom = vC + w / 2;
    } else {
        if (this.parent && !this.parent.$properties.top.changed.isConnected(this, updateVGeometry))
            this.parent.$properties.top.changed.connect(this, updateVGeometry);

        w = height || this.height;
        top = this.y + (this.parent ? this.parent.top : 0);
        bottom = top + w;
        vC = top + w / 2;
    }

    if (top !== undefined)
        this.top = top;
    if (vC !== undefined)
        this.verticalCenter = vC;
    if (bottom !== undefined)
        this.bottom = bottom;
    if (y !== undefined)
        this.y = y;
    if (height !== undefined)
        this.height = height;

    this.$updatingGeometry = false;
    
    if (this.parent != undefined) updateChildrenRect(this.parent);
}

function updateChildrenRect(component){
    
    var children = component !== undefined ? component.children : undefined
    if ( children == undefined || children.length == 0 )
        return;
    
    var maxWidth = 0;
    var maxHeight = 0;
    var minX = children.length>0 ? children[0].x : 0;
    var minY = children.length>0 ? children[0].y : 0;
    var h=0;
    var w=0;
    var child;
 
    for (var i=0;i<children.length; i++){
        child = children[i];
        
        h = child.$isUsingImplicitHeight ? child.implicitHeight : child.height;
        w = child.$isUsingImplicitWidth ? child.implicitWidth : child.width;
        
        maxWidth = Math.max(maxWidth, child.x + w); 
        maxHeight = Math.max(maxHeight, child.y + h);
        minX = Math.min(minX, child.x);
        minY = Math.min(minX, child.y);
    }
    
    component.childrenRect.x = minX;
    component.childrenRect.y = minY;
    component.childrenRect.width = maxWidth;
    component.childrenRect.height = maxHeight;
}

