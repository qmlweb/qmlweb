// eslint-disable-next-line no-undef, max-len
class QtQuick_Particles_CustomParticle extends QtQuick_Particles_ParticlePainter {
  static versions = /^2\./;
  static baseClass = "ParticlePainter";
  static properties = {
    fragmentShader: "string",
    vertexShader: "string"
  };

  // TODO
}
