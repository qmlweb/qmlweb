// eslint-disable-next-line no-undef
class QtQuick_Particles_Emitter extends QtQuick_Item {
  static versions = /^2\./;
  static properties = {
    acceleration: "StochasticDirection",
    emitRate: { type: "real", initialValue: 10 },
    enabled: { type: "bool", initialValue: true },
    endSize: { type: "real", initialValue: -1 },
    group: "string",
    lifeSpan: { type: "int", initialValue: 1000 },
    lifeSpanVariation: "int",
    maximumEmitted: { type: "int", initialValue: -1 },
    shape: "Shape",
    size: { type: "real", initialValue: 16 },
    sizeVariation: "real",
    startTime: "int",
    system: "ParticleSystem",
    velocity: "StochasticDirection",
    velocityFromMovement: "real"
  };
  static signals = {
    emitParticles: [{ type: "Array", name: "particles" }]
  };

  // TODO

  burst(/*count, x, y*/) {
    // TODO
  }
  pulse(duration) {
    if (this.enabled) return;
    this.enabled = true;
    setTimeout(() => {
      this.enabled = false;
    }, duration);
  }
}
