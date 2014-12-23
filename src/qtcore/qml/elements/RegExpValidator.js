registerQmlType('RegExpValidator', function QMLRegExpValidator(meta) {
  QMLItem.call(this, meta);

  createSimpleProperty("var", this, "regExp");

  this.validate = (function(string) {
    if (typeof this.regExp == 'undefined' || this.regExp == null)
      return true;
    return this.regExp.test(string);
  }).bind(this);
});
