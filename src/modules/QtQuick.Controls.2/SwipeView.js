// eslint-disable-next-line no-undef
class QtQuick_Controls_2_SwipeView extends QtQuick_Controls_2_Container {
  static versions = /^2\./;
  static properties = {
    horizontal: "bool",
    interactive: "bool",
    orientation: "enum",
    vertical: "bool"
  };

  // TODO

  layoutChildren() {
    let pos = 0;
    for (let i = 0; i < this.children.length; i++) {
      const child = this.children[i];
      if (!child.visible) continue;
      child.height = this.height;
      child.width = this.width;
      child.x = pos;
      pos += child.width;
    }
  }
}
