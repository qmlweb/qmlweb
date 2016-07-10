registerQmlType({
  module: "QtQuick",
  name: "DoubleValidator",
  versions: /.*/,
  baseClass: "Item",
  enums: {
    DoubleValidator: { StandardNotation: 1, ScientificNotation: 2 }
  },
  properties: {
    bottom: { type: "real", initialValue: -Infinity },
    top: { type: "real", initialValue: Infinity },
    decimals: { type: "int", initialValue: 1000 },
    notation: { type: "enum", initialValue: 2 } // DoubleValidator.ScientificNotation
  }
}, class {
  constructor(meta) {
    callSuper(this, meta);
    this.$standardRegExp = /^(-|\+)?\s*[0-9]+(\.[0-9]+)?$/;
    this.$scientificRegExp = /^(-|\+)?\s*[0-9]+(\.[0-9]+)?(E(-|\+)?[0-9]+)?$/;
  }
  getRegExpForNotation(notation) {
    switch (notation) {
      case DoubleValidator.ScientificNotation:
        return this.$scientificRegExp;
      case DoubleValidator.StandardNotation:
        return this.$standardRegExp;
    }
    return null;
  }
  $getDecimalsForNumber(number) {
    if (Math.round(number) === number) {
      return 0;
    }
    const str = `${number}`;
    return /\d*$/.exec(str)[0].length;
  }
  validate(string) {
    const regExp = this.getRegExpForNotation(this.notation);
    let acceptable = regExp.test(string.trim());
    if (acceptable) {
      const value = parseFloat(string);
      acceptable = this.bottom <= value && this.top >= value;
      acceptable = acceptable && this.$getDecimalsForNumber(value) <= this.decimals;
    }
    return acceptable;
  }
});
