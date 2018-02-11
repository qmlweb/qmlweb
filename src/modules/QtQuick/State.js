// eslint-disable-next-line no-undef
class QtQuick_State extends QtQml_QtObject {
  static properties = {
    name: "string",
    changes: "list",
    extend: "string",
    when: "bool"
  };
  static defaultProperty = "changes";

  constructor(meta) {
    super(meta);

    this.$item = this.$parent;

    this.whenChanged.connect(this, this.$onWhenChanged);
  }
  $getAllChanges() {
    if (this.extend) {
      /* ECMAScript 2015. TODO: polyfill Array?
      const base = this.$item.states.find(state => state.name === this.extend);
      */
      const states = this.$item.states;
      const base = states.filter(state => state.name === this.extend)[0];
      if (base) {
        return base.$getAllChanges().concat(this.changes);
      }
      console.error("Can't find the state to extend!");
    }
    return this.changes;
  }
  $onWhenChanged(newVal) {
    if (newVal) {
      this.$item.state = this.name;
    } else if (this.$item.state === this.name) {
      this.$item.state = "";
    }
  }
}
