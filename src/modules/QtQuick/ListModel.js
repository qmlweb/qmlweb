// eslint-disable-next-line no-undef
class QtQuick_ListModel extends QtQml_QtObject {
  static properties = {
    count: "int",
    $items: "list"
  };
  static defaultProperty = "$items";

  constructor(meta) {
    super(meta);

    this.$firstItem = true;
    this.$itemsChanged.connect(this, this.$on$itemsChanged);
    this.$model = new QmlWeb.JSItemModel();
    this.$model.data = (index, role) => this.$items[index][role];
    this.$model.rowCount = () => this.$items.length;
  }
  $on$itemsChanged(newVal) {
    this.count = this.$items.length;
    if (this.$firstItem && newVal.length > 0) {
      const QMLListElement = QmlWeb.getConstructor(
        "QtQuick", "2.0", "ListElement"
      );
      this.$firstItem = false;
      const roleNames = [];
      let dict = newVal[0];
      if (dict instanceof QMLListElement) {
        dict = dict.$properties;
      }
      for (const i in dict) {
        if (i !== "index") {
          roleNames.push(i);
        }
      }
      this.$model.setRoleNames(roleNames);
    }
  }
  append(dict) {
    const index = this.$items.length;
    let c = 0;

    if (dict instanceof Array) {
      for (const key in dict) {
        this.$items.push(dict[key]);
        c++;
      }
    } else {
      this.$items.push(dict);
      c = 1;
    }

    this.$itemsChanged(this.$items);
    this.$model.rowsInserted(index, index + c);
  }
  clear() {
    this.$items.length = 0;
    this.count = 0;
    this.$model.modelReset();
  }
  get(index) {
    return this.$items[index];
  }
  insert(index, dict) {
    this.$items.splice(index, 0, dict);
    this.$itemsChanged(this.$items);
    this.$model.rowsInserted(index, index + 1);
  }
  move(from, to, n) {
    const vals = this.$items.splice(from, n);
    for (let i = 0; i < vals.length; i++) {
      this.$items.splice(to + i, 0, vals[i]);
    }
    this.$model.rowsMoved(from, from + n, to);
  }
  remove(index) {
    this.$items.splice(index, 1);
    this.$model.rowsRemoved(index, index + 1);
    this.count = this.$items.length;
  }
  set(index, dict) {
    this.$items[index] = dict;
    this.$model.dataChanged(index, index);
  }
  setProperty(index, property, value) {
    this.$items[index][property] = value;
    this.$model.dataChanged(index, index);
  }
}
