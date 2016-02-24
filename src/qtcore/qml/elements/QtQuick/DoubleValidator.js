var DoubleValidator = {
  StandardNotation: 1, ScientificNotation: 2
};

registerQmlType({
  module:   'QtQuick',
  name:     'DoubleValidator',
  versions: /.*/,
  constructor: function QMLDoubleValidator(meta) {
    QMLItem.call(this, meta);

    createSimpleProperty("real", this, "bottom");
    createSimpleProperty("real", this, "top");
    createSimpleProperty("int",  this, "decimals");
    createSimpleProperty("enum", this, "notation");
    this.bottom   = -Infinity;
    this.top      = Infinity;
    this.decimals = 1000;
    this.notation = DoubleValidator.ScientificNotation;

    var standardRegExp   = /^(-|\+)?\s*[0-9]+(\.[0-9]+)?$/;
    var scientificRegExp = /^(-|\+)?\s*[0-9]+(\.[0-9]+)?(E(-|\+)?[0-9]+)?$/;

    this.getRegExpForNotation = (function(notation) {
      switch (notation) {
        case DoubleValidator.ScientificNotation:
          return scientificRegExp;
          break ;
        case DoubleValidator.StandardNotation:
          return standardRegExp;
          break ;
      }
      return null;
    }).bind(this);

    function getDecimalsForNumber(number) {
      if (Math.round(number) != number) {
        var str = '' + number;

        return /\d*$/.exec(str)[0].length;
      }
      return 0;
    }

    this.validate = (function(string) {
      var regExp     = this.getRegExpForNotation(this.notation);
      var acceptable = regExp.test(string.trim());

      if (acceptable) {
        var value    = parseFloat(string);

        acceptable   = this.bottom <= value && this.top >= value;
        acceptable   = acceptable && getDecimalsForNumber(value) <= this.decimals;
      }
      return acceptable;
    }).bind(this);
  }
});

