registerQmlType({
  module:   'QtMobility',
  name:     'GeoLocation',
  versions: /.*/,
  baseClass: QMLItem,
  constructor: function QMLGeoLocation(meta) {
    var self = this;
    QMLItem.call(this, meta);

    createProperty({ type: "double", object: this, name: "accuracy" });
    createProperty({ type: "double", object: this, name: "altitude" });
    createProperty({ type: "double", object: this, name: "altitudeAccuracy" });
    createProperty({ type: "double", object: this, name: "heading" });
    createProperty({ type: "string", object: this, name: "label" });
    createProperty({ type: "double", object: this, name: "latitude" });
    createProperty({ type: "double", object: this, name: "longitude" });
    createProperty({ type: "double", object: this, name: "speed" });
    createProperty({ type: "date",   object: this, name: "timestamp" });

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition
    }

    var updatePosition = (function(position) {
      this.accuracy         = position.coords.accuracy;
      this.altitude         = position.coords.altitude;
      this.altitudeAccuracy = position.coords.altitudeAccuracy;
      this.heading          = position.coords.heading;
      this.latitude         = position.coords.latitude;
      this.longitude        = position.coords.longitude;
      this.speed            = position.coords.speed;
      this.timestamp        = position.timestamp;
    }).bind(this);

    navigator.geolocation.getCurrentPosition(updatePosition);
    navigator.geolocation.watchPosition(updatePosition);
  }
});
