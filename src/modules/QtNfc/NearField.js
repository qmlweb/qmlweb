// eslint-disable-next-line no-undef
class QtNfc_NearField extends QtQml_QtObject {
  static properties = {
    filter: "list",
    messageRecords: "list",
    orderMatch: "bool",
    polling: "bool"
  };
  static signals = {
    tagFound: [],
    tagRemoved: []
  };

  // TODO: implementation based on Web NFC API
}
