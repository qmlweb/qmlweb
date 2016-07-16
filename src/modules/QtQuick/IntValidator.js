registerQmlType({
  module: "QtQuick",
  name: "IntValidator",
  versions: /.*/,
  baseClass: "Item",
  properties: {
    bottom: { type: "int", initialValue: -2147483647 },
    top: { type: "int", initialValue: 2147483647 }
  }
}, class {
  constructor(meta) {
    callSuper(this, meta);

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
