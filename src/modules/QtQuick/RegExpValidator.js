QmlWeb.registerQmlType({
  module: "QtQuick",
  name: "RegExpValidator",
  versions: /.*/,
  baseClass: "Item",
  properties: {
    regExp: "var"
  }
}, class {
  constructor(meta) {
    QmlWeb.callSuper(this, meta);
  }
  validate(string) {
    if (!this.regExp) return true;
    return this.regExp.test(string);
  }
});
