registerQmlType({
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
    callSuper(this, meta);

    this.$previousSource = null;
    this.$filterObject = undefined;

    this.radiusChanged.connect(this, this.$onRadiusChanged);
    this.sourceChanged.connect(this, this.$onSourceChanged);
  }
  $onRadiusChanged(newVal) {
    this.$updateEffect(this.source);
  }
  $onSourceChanged(newVal) {
    this.$updateEffect(this.source);
  }
  $updateFilterObject() {
    this.$filterObject = {
      transformType: "filter",
      operation: "blur",
      parameters: `${this.radius}px`
    };
  }
  $stripEffectFromSource(source) {
    if (this.$previousSource) {
      const index = this.$previousSource.transform.indexOf(this.$filterObject);
      this.$previousSource.transform.splice(index, 1);
      this.$previousSource.$updateTransform();
    }
  }
  $updateEffect(source) {
    console.log("updating effect");
    this.stripEffectFromSource(this.$previousSource);
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
