registerQmlType({
    module: 'QtQuick',
    name: 'NumberAnimation',
    versions: /.*/,
    constructor: function QMLNumberAnimation(meta) {
        var QMLPropertyAnimation = getConstructor('QtQuick', '2.0', 'PropertyAnimation');

        QMLPropertyAnimation.call(this, meta);
        var at = 0,
            loop = 0,
            self = this;

        engine.$addTicker(ticker);

        function ticker(now, elapsed) {
            if ((self.running || loop === -1) && !self.paused) {
                if (at == 0 && loop == 0 && !self.$actions.length)
                    self.$redoActions();
                at += elapsed / self.duration;
                if (at >= 1)
                    self.complete();
                else
                    for (var i in self.$actions) {
                        var action = self.$actions[i],
                            value = self.easing.$valueForProgress(at) * (action.to - action.from) + action.from;
                        action.target.$properties[action.property].set(value, true);
                    }
            }
        }

        function startLoop() {
            for (var i in this.$actions) {
                var action = this.$actions[i];
                action.from = action.from !== Undefined ? action.from : action.target[action.property];
            }
            at = 0;
        }

        this.runningChanged.connect(this, function (newVal) {
            if (newVal) {
                startLoop.call(this);
                this.paused = false;
            } else if (this.alwaysRunToEnd && at < 1) {
                loop = -1;
            } else {
                loop = 0;
                this.$actions = [];
            }
        });

        this.complete = function () {
            for (var i in this.$actions) {
                var action = this.$actions[i];
                action.target.$properties[action.property].set(action.to, true);
            }

            if (++loop == this.loops)
                this.running = false;
            else if (!this.running)
                this.$actions = [];
            else
                startLoop.call(this);
        }
    }
});
