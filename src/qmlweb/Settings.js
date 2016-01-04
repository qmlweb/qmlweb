registerQmlType({
  module: 'QtQuick',
  name:   'Settings',
  versions: /.*/,
  baseClass: QMLItem,
  constructor: function QMLSettings(meta) {
    QMLItem.call(this, meta);

    createSimpleProperty("string", this, "category");

    if (typeof window.localStorage == 'undefined')
      return ;

    var attributes;

    var getKey = (function(attrName) {
      return this.category + '/' + attrName;
    }).bind(this);

    var loadProperties = (function() {
      for (var i = 0 ; i < attributes.length ; ++i) {
        this[attributes[i]] = localStorage.getItem(getKey(attributes[i]));
      }
    }).bind(this);

    var initializeProperties = (function() {
      for (var i = 0 ; i < attributes.length ; ++i) {
        var attrName   = attributes[i];
        var signalName = attrName + 'Changed';
        var emitter    = this;

        if (this.$properties[attrName].type == 'alias') {
          emitter    = this.$context[this.$properties[attrName].val.objectName];
          signalName = this.$properties[attrName].val.propertyName + 'Changed';
        }
        emitter[signalName].connect(this, (function() {
          localStorage.setItem(getKey(this.attrName), this.self[this.attrName]);
        }).bind({ self: this, attrName: attrName }));
      }
    }).bind(this);

    this.Component.completed.connect(this, (function() {
      attributes = this.getAttributes();
      loadProperties();
      initializeProperties();
    }).bind(this));
  }
});
