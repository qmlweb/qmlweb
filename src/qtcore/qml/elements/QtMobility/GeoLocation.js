registerQmlType({
    module: 'QtMobility',
    name: 'GeoLocation',
    versions: /.*/,
    constructor: function QMLGeoLocation(meta) {
        var self = this;
        QMLItem.call(this, meta);

        createSimpleProperty("double", this, "accuracy");
        createSimpleProperty("double", this, "altitude");
        createSimpleProperty("double", this, "altitudeAccuracy");
        createSimpleProperty("double", this, "heading");
        createSimpleProperty("string", this, "label");
        createSimpleProperty("double", this, "latitude");
        createSimpleProperty("double", this, "longitude");
        createSimpleProperty("double", this, "speed");
        createSimpleProperty("date", this, "timestamp");

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition
        }

        var updatePosition = (function (position) {
            this.accuracy = position.coords.accuracy;
            this.altitude = position.coords.altitude;
            this.altitudeAccuracy = position.coords.altitudeAccuracy;
            this.heading = position.coords.heading;
            this.latitude = position.coords.latitude;
            this.longitude = position.coords.longitude;
            this.speed = position.coords.speed;
            this.timestamp = position.timestamp;
        }).bind(this);

        navigator.geolocation.getCurrentPosition(updatePosition);
        navigator.geolocation.watchPosition(updatePosition);
    }
});
