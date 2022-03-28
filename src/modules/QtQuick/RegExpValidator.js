// eslint-disable-next-line no-undef
class QtQuick_RegExpValidator extends QtQml_QValidator {
  static properties = {
    regExp: "var"
  };

  validate(string) {
    if (!this.regExp) return true;
    return this.regExp.test(string)
      ? this.QValidator.Acceptable
      : this.QValidator.Invalid;
  }
}
