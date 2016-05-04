function QMLDomElement(meta) {
    var tagName = meta.object.tagName || 'div';
    this.dom = document.createElement(tagName);
    QMLItem.call(this, meta);

    createProperty('string', this, 'tagName');

    // TODO: support properties, styles, perhaps changing the tagName
}

registerQmlType({
    module: 'QmlWeb.Dom',
    name: 'DomElement',
    versions: /.*/,
    baseClass: 'QtQuick.Item',
    constructor: QMLDomElement
});
