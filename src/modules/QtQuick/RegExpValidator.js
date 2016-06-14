registerQmlType({
  module:   'QtQuick',
  name:     'RegExpValidator',
  versions: /.*/,
  baseClass: 'Item'
}, class {
  constructor(meta) {
    callSuper(this, meta);

    createProperty("var", this, "regExp");

    this.validate = (function(string) {
      if (typeof this.regExp == 'undefined' || this.regExp == null)
        return true;
      return this.regExp.test(string);
    }).bind(this);
  }
});
