/* eslint-disable no-unused-vars */

function formatString(sourceText, n) {
  let text = sourceText;
  if (typeof n !== "undefined") {
    if (typeof n !== "number") {
      throw new Error("(n) must be a number");
    }
    text = text.replace(/%n/, n.toString(10));
  }
  return text;
}

QmlWeb.qsTr = function(sourceText, disambiguation, n) {
  return formatString(sourceText, n);
};

QmlWeb.qsTrId = function(id, n) {
  return formatString(id, n);
};

QmlWeb.qsTranslate = function(context, sourceText, disambiguation, n) {
  return formatString(sourceText, n);
};

// Somewhy these are documented, but not defined in Qt QML 5.10
/*
QmlWeb.qsTrIdNoOp = function(id) {
  return id;
};

QmlWeb.qsTrNoOp = function(sourceText, disambiguation) {
  return sourceText;
};

QmlWeb.qsTranslateNoOp = function(context, sourceText, disambiguation) {
  return sourceText;
};
*/
