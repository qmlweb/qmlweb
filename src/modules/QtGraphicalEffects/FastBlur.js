QmlWeb.registerQmlType({
  module: "QtGraphicalEffects",
  name: "FastBlur",
  versions: /.*/,
  baseClass: "QtQuick.Item",
  properties: {
    radius: "real",
    source: { type: "var", initialValue: null }
  }
}, class {
  constructor(meta) {
    QmlWeb.callSuper(this, meta);

    this.$previousSource = null;
    this.$filterObject = undefined;

    this.radiusChanged.connect(this, this.$onRadiusChanged);
    this.sourceChanged.connect(this, this.$onSourceChanged);
  }
  $onRadiusChanged() {
    this.$updateEffect(this.source);
  }
  $onSourceChanged() {
    this.$updateEffect(this.source);
  }
  $updateFilterObject() {
    this.$filterObject = {
      transformType: "filter",
      operation: "blur",
      parameters: `${this.radius}px`
    };
  }
  $updateEffect(source) {
    console.log("updating effect");
    if (this.$previousSource) {
      const index = this.$previousSource.transform.indexOf(this.$filterObject);
      this.$previousSource.transform.splice(index, 1);
      this.$previousSource.$updateTransform();
    }
    if (source && source.transform) {
      this.$updateFilterObject();
      console.log("updating effect:", this.$filterObject, source);
      source.transform.push(this.$filterObject);
      source.$updateTransform();
      this.$previousSource = source;
    } else {
      this.$previousSource = null;
    }
  }
});
