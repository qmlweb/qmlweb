// eslint-disable-next-line no-undef
class QtQuick_Layouts_AbstractLayout extends QtQuick_Item {
  constructor(meta) {
    super(meta);
    this.layoutChildren();
    this.childrenChanged.connect(this, this.$onChildrenChanged);
    this.childrenChanged.connect(this, this.layoutChildren);
    this.widthChanged.connect(this, this.$onWidthChanged);
    this.heightChanged.connect(this, this.$onHeightChanged);
  }

  $plugChildrenSignals(children, action, watchedProperties = []) {
    const Layout = QmlWeb.getConstructor("QtQuick.Layouts", "1.0", "Layout");
    const flags = QmlWeb.Signal.UniqueConnection;
    const signals = [];
    for (let i = 0; i < this.children.length; i++) {
      const child = this.children[i];
      child.$Layout = Layout.getAttachedObject.bind(child)();
      for (const property in child.$Layout.$properties) {
        signals.push(child.$Layout.$properties[property].changed);
      }
      for (const propertyName of watchedProperties) {
        signals.push(child.$properties[propertyName].changed);
      }
      signals.push(child.implicitWidthChanged);
      signals.push(child.implicitHeightChanged);
    }
    signals.forEach(signal => signal[action](this, this.layoutChildren, flags));
  }

  $onChildrenChanged(newVal, oldVal) {
    this.$plugChildrenSignals(oldVal, "disconnect");
    this.$plugChildrenSignals(newVal, "connect");
  }

  $onWidthChanged() {
    if (!this.$isUsingImplicitWidth) {
      this.layoutChildren();
    }
  }

  $onHeightChanged() {
    if (!this.$isUsingImplicitHeight) {
      this.layoutChildren();
    }
  }

  $inferCellSize(child, direction) {
    let size = child[`implicit${direction}`];

    if (child.$Layout[`preferred${direction}`]) {
      size = child.$Layout[`preferred${direction}`];
    }
    if (child.$Layout[`minimum${direction}`]) {
      size = Math.max(child.$Layout[`minimum${direction}`], size);
    }
    if (child.$Layout[`maximum${direction}`]) {
      size = Math.min(child.$Layout[`maximum${direction}`], size);
    }
    return size;
  }

  $inferCellMargin(child, direction) {
    const directionMargin = child.$Layout[`${direction}Margin`];
    const generalMargin = child.$Layout.margins;

    return directionMargin === null ? generalMargin : directionMargin;
  }

  $inferCellHMargin(child) {
    return this.$inferCellMargin(child, "left")
      + this.$inferCellMargin(child, "right");
  }

  $inferCellVMargin(child) {
    return this.$inferCellMargin(child, "top")
      + this.$inferCellMargin(child, "bottom");
  }
}
