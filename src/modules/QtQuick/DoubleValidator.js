// eslint-disable-next-line no-undef
class QtQuick_DoubleValidator extends QtQml_QValidator {
  static enums = {
    DoubleValidator: { StandardNotation: 1, ScientificNotation: 2 }
  };
  static properties = {
    bottom: { type: "real", initialValue: -Infinity },
    top: { type: "real", initialValue: Infinity },
    decimals: { type: "int", initialValue: 1000 },
    // DoubleValidator.ScientificNotation
    notation: { type: "enum", initialValue: 2 }
  };

  constructor(meta) {
    super(meta);
    this.$standardRegExp = /^(-|\+)?\s*[0-9]+(\.[0-9]+)?$/;
    this.$scientificRegExp = /^(-|\+)?\s*[0-9]+(\.[0-9]+)?(E(-|\+)?[0-9]+)?$/;
  }
  getRegExpForNotation(notation) {
    switch (notation) {
      case this.DoubleValidator.ScientificNotation:
        return this.$scientificRegExp;
      case this.DoubleValidator.StandardNotation:
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
    if (!regExp.test(string.trim())) {
      return false;
    }
    const value = parseFloat(string);
    const acceptable = this.bottom <= value && this.top >= value &&
           this.$getDecimalsForNumber(value) <= this.decimals;
    return acceptable
      ? this.QValidator.Acceptable
      : this.QValidator.Invalid;
  }
}
