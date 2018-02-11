// eslint-disable-next-line no-undef
class QtQuick_RegExpValidator extends QtQuick_Item {
  static properties = {
    regExp: "var"
  };

  validate(string) {
    if (!this.regExp) return true;
    return this.regExp.test(string);
  }
}
