registerQmlType({
  module:   'QtQuick',
  name:     'IntValidator',
  versions: /.*/,
  baseClass: 'Item',
  constructor: function QMLIntValidator(meta) {
    callSuper(this, meta);

    createProperty("int", this, "bottom");
    createProperty("int", this, "top");
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

