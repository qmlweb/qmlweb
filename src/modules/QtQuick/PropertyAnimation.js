registerQmlType({
  module:   'QtQuick',
  name:     'PropertyAnimation',
  versions: /.*/,
  baseClass: 'Animation',
  constructor: function QMLPropertyAnimation(meta) {
    callSuper(this, meta);

    createProperty("int", this, "duration", {initialValue: 250});
    createProperty("real", this, "from");
    createProperty("string", this, "properties");
    createProperty("string", this, "property");
    createProperty("QtObject", this, "target");
    createProperty("list", this, "targets");
    createProperty("real", this, "to");

    this.easing = new QObject(this);
    createProperty("enum", this.easing, "type", {initialValue: Easing.Linear});
    createProperty("real", this.easing, "amplitude", {initialValue: 1});
    createProperty("real", this.easing, "overshoot", {initialValue: 0.3});
    createProperty("real", this.easing, "period", {initialValue: 1.70158});

    this.easing.$valueForProgress = function(t) {
        switch(this.type) {
            // Quad
            case Easing.InQuad: return Math.pow(t, 2);
            case Easing.OutQuad: return -Math.pow(t - 1, 2) + 1;
            case Easing.InOutQuad:
                if (t < 0.5)
                    return 2 * Math.pow(t, 2);
                return -2 * Math.pow(t - 1, 2) + 1;
            case Easing.OutInQuad:
                if (t < 0.5)
                    return -2 * Math.pow(t - 0.5, 2) + 0.5;
                return 2 * Math.pow(t - 0.5, 2) + 0.5;
            // Cubic
            case Easing.InCubic: return Math.pow(t, 3);
            case Easing.OutCubic: return Math.pow(t - 1, 3) + 1;
            case Easing.InOutCubic:
                if (t < 0.5)
                    return 4 * Math.pow(t, 3);
                return 4 * Math.pow(t - 1, 3) + 1;
            case Easing.OutInCubic:
                return 4 * Math.pow(t - 0.5, 3) + 0.5;
            // Quart
            case Easing.InQuart: return Math.pow(t, 4);
            case Easing.OutQuart: return -Math.pow(t - 1, 4) + 1;
            case Easing.InOutQuart:
                if (t < 0.5)
                    return 8 * Math.pow(t, 4);
                return -8 * Math.pow(t - 1, 4) + 1;
            case Easing.OutInQuart:
                if (t < 0.5)
                    return -8 * Math.pow(t - 0.5, 4) + 0.5;
                return 8 * Math.pow(t - 0.5, 4) + 0.5;
            // Quint
            case Easing.InQuint: return Math.pow(t, 5);
            case Easing.OutQuint: return Math.pow(t - 1, 5) + 1;
            case Easing.InOutQuint:
                if (t < 0.5)
                    return 16 * Math.pow(t, 5);
                return 16 * Math.pow(t - 1, 5) + 1;
            case Easing.OutInQuint:
                if (t < 0.5)
                    return 16 * Math.pow(t - 0.5, 5) + 0.5;
                return 16 * Math.pow(t - 0.5, 5) + 0.5;
            // Sine
            case Easing.InSine: return -Math.cos(0.5 * Math.PI * t) + 1;
            case Easing.OutSine: return Math.sin(0.5 * Math.PI * t);
            case Easing.InOutSine: return -0.5 * Math.cos(Math.PI * t) + 0.5;
            case Easing.OutInSine:
                if (t < 0.5)
                    return 0.5 * Math.sin(Math.PI * t);
                return -0.5 * Math.sin(Math.PI * t) + 1;
            // Expo
            case Easing.InExpo: return (1/1023) * (Math.pow(2, 10*t) - 1);
            case Easing.OutExpo: return -(1024/1023) * (Math.pow(2, -10*t) - 1);
            case Easing.InOutExpo:
                if (t < 0.5)
                    return (1/62) * (Math.pow(2, 10*t) - 1);
                return -(512/31) * Math.pow(2, -10*t) + (63/62);
            case Easing.OutInExpo:
                if (t < 0.5)
                    return -(16/31) * (Math.pow(2, -10*t) - 1);
                return (1/1984) * Math.pow(2, 10*t) + (15/31);
            // Circ
            case Easing.InCirc: return 1 - Math.sqrt(1 - t*t);
            case Easing.OutCirc: return Math.sqrt(1 - Math.pow(t - 1, 2));
            case Easing.InOutCirc:
                if (t < 0.5)
                    return 0.5 * (1 - Math.sqrt(1 - 4*t*t));
                return 0.5 * (Math.sqrt(1 - 4 * Math.pow(t - 1, 2)) + 1);
            case Easing.OutInCirc:
                if (t < 0.5)
                    return 0.5 * Math.sqrt(1 - Math.pow(2 * t - 1, 2));
                return 0.5 * (2 - Math.sqrt(1 - Math.pow(2 * t - 1, 2)));
            // Elastic
            case Easing.InElastic:
                return -this.amplitude * Math.pow(2, 10 * t - 10)
                        * Math.sin(2 * t * Math.PI / this.period - Math.asin(1 / this.amplitude));
            case Easing.OutElastic:
                return this.amplitude * Math.pow(2, -10 * t)
                        * Math.sin(2 * t * Math.PI / this.period - Math.asin(1 / this.amplitude))
                        + 1;
            case Easing.InOutElastic:
                if (t < 0.5)
                    return -0.5 * this.amplitude * Math.pow(2, 20 * t - 10)
                            * Math.sin(4 * t * Math.PI / this.period - Math.asin(1 / this.amplitude));
                return -0.5 * this.amplitude * Math.pow(2, -20 * t + 10)
                        * Math.sin(4 * t * Math.PI / this.period + Math.asin(1 / this.amplitude))
                        + 1;
            case Easing.OutInElastic:
                if (t < 0.5)
                    return 0.5 * this.amplitude * Math.pow(2, -20 * t)
                            * Math.sin(4 * t * Math.PI / this.period - Math.asin(1 / this.amplitude))
                            + 0.5;
                return -0.5 * this.amplitude * Math.pow(2, 20 * t - 20)
                        * Math.sin(4 * t * Math.PI / this.period - Math.asin(1 / this.amplitude))
                        + 0.5;
            // Back
            case Easing.InBack: return (this.overshoot + 1) * Math.pow(t, 3) - this.overshoot * Math.pow(t, 2);
            case Easing.OutBack: return (this.overshoot + 1) * Math.pow(t - 1, 3) + this.overshoot * Math.pow(t - 1, 2) + 1;
            case Easing.InOutBack:
                if (t < 0.5)
                    return 4 * (this.overshoot + 1) * Math.pow(t, 3) - 2 * this.overshoot * Math.pow(t, 2);
                return 0.5 * (this.overshoot + 1) * Math.pow(2 * t - 2, 3) + this.overshoot/2 * Math.pow(2 * t - 2, 2) + 1;
            case Easing.OutInBack:
                if (t < 0.5)
                    return 0.5 * ((this.overshoot + 1) * Math.pow(2 * t - 1, 3) + this.overshoot * Math.pow(2 * t - 1, 2) + 1);
                return 4 * (this.overshoot + 1) * Math.pow( t - 0.5, 3) - 2 * this.overshoot * Math.pow(t - 0.5, 2) + 0.5;
            // Bounce
            case Easing.InBounce:
                if (t < 1/11) return -this.amplitude * (121/16) * (t*t - (1/11)*t);
                if (t < 3/11) return -this.amplitude * (121/16) * (t*t - (4/11)*t + (3/121));
                if (t < 7/11) return -this.amplitude * (121/16) * (t*t - (10/11)*t + (21/121));
                return -(121/16) * (t*t - 2*t + 1) + 1;
            case Easing.OutBounce:
                if (t < 4/11) return (121/16) * t*t;
                if (t < 8/11) return this.amplitude * (121/16) * (t*t - (12/11)*t + (32/121)) + 1;
                if (t < 10/11) return this.amplitude * (121/16) * (t*t - (18/11)*t + (80/121)) + 1;
                return this.amplitude * (121/16) * (t*t - (21/11)*t + (10/11)) + 1;
            case Easing.InOutBounce:
                if (t < 1/22) return -this.amplitude * (121/8) * (t*t - (1/22)*t);
                if (t < 3/22) return -this.amplitude * (121/8) * (t*t - (2/11)*t + (3/484));
                if (t < 7/22) return -this.amplitude * (121/8) * (t*t - (5/11)*t + (21/484));
                if (t < 11/22) return -(121/8) * (t*t - t + 0.25) + 0.5;
                if (t < 15/22) return (121/8) * (t*t - t) + (137/32);
                if (t < 19/22) return this.amplitude * (121/8) * (t*t - (17/11)*t + (285/484)) + 1;
                if (t < 21/22) return this.amplitude * (121/8) * (t*t - (20/11)*t + (399/484)) + 1;
                return this.amplitude * (121/8) * (t*t - (43/22)*t + (21/22)) + 1;
            case Easing.OutInBounce:
                if (t < 4/22) return (121/8) * t*t;
                if (t < 8/22) return -this.amplitude * (121/8) * (t*t - (6/11)*t + (8/121)) + 0.5;
                if (t < 10/22) return -this.amplitude * (121/8) * (t*t - (9/11)*t + (20/121)) + 0.5;
                if (t < 11/22) return -this.amplitude * (121/8) * (t*t - (21/22)*t + (5/22)) + 0.5;
                if (t < 12/22) return this.amplitude * (121/8) * (t*t - (23/22)*t + (3/11)) + 0.5;
                if (t < 14/22) return this.amplitude * (121/8) * (t*t - (13/11)*t + (42/121)) + 0.5;
                if (t < 18/22) return this.amplitude * (121/8) * (t*t - (16/11)*t + (63/121)) + 0.5;
                return -(121/8) * (t*t - 2*t + (117/121)) + 0.5;
            // Default
            default:
                console.log("Unsupported animation type: ", this.type);
            // Linear
            case Easing.Linear:
                return t;
        }
    }

    this.$redoActions = function() {
        this.$actions = [];
        for (var i = 0; i < this.$targets.length; i++) {
            for (var j in this.$props) {
                this.$actions.push({
                    target: this.$targets[i],
                    property: this.$props[j],
                    from: this.from,
                    to: this.to
                });
            }
        }
    }
    function redoProperties() {
        this.$props = this.properties.split(",");

        // Remove whitespaces
        for (var i = 0; i < this.$props.length; i++) {
            var matches = this.$props[i].match(/\w+/);
            if (matches) {
                this.$props[i] = matches[0];
            } else {
                this.$props.splice(i, 1);
                i--;
            }
        }
        // Merge properties and property
        if (this.property && this.$props.indexOf(this.property) === -1)
            this.$props.push(this.property);
    }
    function redoTargets() {
        this.$targets = this.targets.slice();

        if (this.target && this.$targets.indexOf(this.target) === -1)
            this.$targets.push(this.target);
    }

    this.duration = 250;
    this.easing.type = Easing.Linear;
    this.easing.amplitude = 1;
    this.easing.period = 0.3;
    this.easing.overshoot = 1.70158;
    this.$props = [];
    this.$targets = [];
    this.$actions = [];
    this.properties = "";
    this.targets = [];

    this.targetChanged.connect(this, redoTargets);
    this.targetsChanged.connect(this, redoTargets);
    this.propertyChanged.connect(this, redoProperties);
    this.propertiesChanged.connect(this, redoProperties);

    if (meta.object.$on !== undefined) {
        this.property = meta.object.$on;
        this.target = this.$parent;
    }
  }
});

