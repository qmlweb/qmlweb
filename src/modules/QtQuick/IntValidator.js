// eslint-disable-next-line no-undef
class QtQuick_IntValidator extends QtQml_QValidator {
  static properties = {
    bottom: { type: "int", initialValue: -2147483647 },
    top: { type: "int", initialValue: 2147483647 }
  };

  validate(string) {
    const regExp = /^(-|\+)?\s*[0-9]+$/;

    if (regExp.test(string.trim())) {
      const value = parseInt(string, 10);
      if (this.bottom <= value && this.top >= value) {
        return this.QValidator.Acceptable;
      } else if (string.length <= this.top.toString().length) {
        return this.QValidator.Intermediate;
      }
    }
    return this.QValidator.Invalid;
  }
}
