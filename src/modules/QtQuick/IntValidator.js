// eslint-disable-next-line no-undef
class QtQuick_IntValidator extends QtQuick_Item {
  static properties = {
    bottom: { type: "int", initialValue: -2147483647 },
    top: { type: "int", initialValue: 2147483647 }
  };

  validate(string) {
    const regExp = /^(-|\+)?\s*[0-9]+$/;
    let acceptable = regExp.test(string.trim());

    if (acceptable) {
      const value = parseInt(string, 10);
      acceptable = this.bottom <= value && this.top >= value;
    }
    return acceptable;
  }
}
