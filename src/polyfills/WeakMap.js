// This is a very simple and incomplete polyfill, but it serves our needs

// NOTE: there is nothing weak about this polyfill, but that's what we get on
// older browsers. It still helps us to use the real WeakMap on browsers that
// support it (aka everything newer than IE10).

// NOTE: new WeakMap(iterable) is not supported by this polyfill and has lower
// browser support than just WeakMap, so if we ever need it, the feature
// detection should be also improved.

// NOTE: in this polyfill, keys are converted to strings. Keep that in mind.

const WeakMap = global.WeakMap || global.Map || (() => {
  const hasOwnProperty = Object.prototype.hasOwnProperty;
  return class {
    constructor(...args) {
      if (args.length > 0) throw new Error("Not supported!");
      this.$data = Object.create(null);
    }
    delete(key) {
      delete this.$data[key];
    }
    get(key) {
      return this.$data[key];
    }
    has(key) {
      return hasOwnProperty.call(this.$data, key);
    }
    set(key, value) {
      this.$data[key] = value;
    }
  };
})();
