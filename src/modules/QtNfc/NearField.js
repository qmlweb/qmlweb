QmlWeb.registerQmlType({
  module: "QtNfc",
  name: "NearField",
  versions: /.*/,
  baseClass: "QtQml.QtObject",
  properties: {
    filter: "list",
    messageRecords: "list",
    orderMatch: "bool",
    polling: "bool"
  },
  signals: {
    tagFound: [],
    tagRemoved: []
  }
}, class {
  constructor(meta) {
    QmlWeb.callSuper(this, meta);

    // TODO: implementation based on Web NFC API
  }
});
