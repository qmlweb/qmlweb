registerQmlType({
  module: 'QtQuick',
  name:   'ListElement',
  versions: /.*/,
  baseClass: 'QtQml.QtObject',
  constructor: function QMLListElement(meta) {
    callSuper(this, meta);

    for (var i in meta.object) {
        if (i[0] != "$") {
            createProperty("variant", this, i);
        }
    }
    applyProperties(meta.object, this, this, this.$context);
  }
});
