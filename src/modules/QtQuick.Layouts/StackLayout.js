// eslint-disable-next-line no-undef
class QtQuick_Layouts_StackLayout extends QtQuick_Layouts_AbstractLayout {
  static versions = /^1\./;
  static properties = {
    count: "int",
    currentIndex: "int"
  };

  constructor(meta) {
    super(meta);
    window.bite = this;
    this.childrenChanged.connect(this, this.$updateCount);
    this.currentIndexChanged.connect(this, this.layoutChildren);
  }

  $updateCount() {
    this.count = this.children.length;
  }

  layoutChildren() {
    if (this.currentIndex < this.children.length) {
      const currentItem = this.children[this.currentIndex];

      this.$updateSize(currentItem, "Width");
      this.$updateSize(currentItem, "Height");
    }
    this.children.forEach(this.$updateChildVisibility.bind(this));
  }

  $updateSize(child, direction) {
    const propertyName = direction[0].toLowerCase() + direction.slice(1);

    if (this[`$isUsingImplicit${direction}`]) {
      this[`implicit${direction}`] = this.$inferCellSize(child, direction);
    } else if (child.$Layout[`fill${direction}`] !== false) {
      child[propertyName] = this[propertyName];
    } else {
      child[propertyName] = child[`implicit${direction}`];
    }
  }

  $updateChildVisibility(child) {
    child.visible = this.currentIndex === this.children.indexOf(child);
  }
}
