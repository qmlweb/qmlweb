registerQmlType({
  module:   'QtQuick',
  name:     'RegExpValidator',
  versions: /.*/,
  baseClass: "Item",
  properties: {
    regExp: "var"
  }
}, class {
  constructor(meta) {
    callSuper(this, meta);

    this.validate = (function(string) {
      if (typeof this.regExp == 'undefined' || this.regExp == null)
        return true;
      return this.regExp.test(string);
    }).bind(this);
  }
});
