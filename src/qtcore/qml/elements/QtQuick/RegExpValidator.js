registerQmlType({
  module:   'QtQuick',
  name:     'RegExpValidator',
  versions: /.*/,
  baseClass: QMLItem,
  constructor: function QMLRegExpValidator(meta) {
    QMLItem.call(this, meta);

    createProperty({ type: "var", object: this, name: "regExp" });

    this.validate = (function(string) {
      if (typeof this.regExp == 'undefined' || this.regExp == null)
        return true;
      return this.regExp.test(string);
    }).bind(this);
  }
});
