registerQmlType({
  module:   'QtQuick',
  name:     'IntValidator',
  versions: /.*/,
  baseClass: QMLItem,
  constructor: function QMLIntValidator(meta) {
    QMLItem.call(this, meta);

    createSimpleProperty("int", this, "bottom");
    createSimpleProperty("int", this, "top");
    this.bottom = -2147483647;
    this.top    = 2147483647;

    this.validate = (function(string) {
      var regExp     = /^(-|\+)?\s*[0-9]+$/;
      var acceptable = regExp.test(string.trim());

      if (acceptable) {
        var value    = parseInt(string);

        acceptable   = this.bottom <= value && this.top >= value;
      }
      return acceptable;
    }).bind(this);
  }
});

