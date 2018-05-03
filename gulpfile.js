"use strict";

const gulp = require("gulp");
const concat = require("gulp-concat");
const rename = require("gulp-rename");
const changed = require("gulp-changed");
const order = require("gulp-order");
const uglify = require("gulp-uglify");
const sourcemaps = require("gulp-sourcemaps");
const iife = require("gulp-iife");
const babel = require("gulp-babel");
const replace = require("gulp-replace");
const karma = require("karma");
const path = require("path");
const shaker = require("./builder/shaker");

const sources = [
  "src/QmlWeb.js",
  "src/qtbase/QObject.js",
  "src/qtbase/*.js",
  "src/modules/QtQml/Qt.js",
  "src/engine/QML*.js",
  "src/engine/*.js",
  "src/modules/**/*.js"
];

const parserSources = [
  "node_modules/qmlweb-parser/lib/*"
];

const licenseSources = [
  "LICENSE",
  "node_modules/qmlweb-parser/LICENSE"
];

gulp.task("license", () =>
  gulp.src(licenseSources)
    .pipe(order(licenseSources, { base: __dirname }))
    .pipe(concat("LICENSE"))
    .pipe(changed("./lib"))
    .pipe(gulp.dest("./lib"))
);

gulp.task("parser", () =>
  gulp.src(parserSources)
    .pipe(gulp.dest("./lib"))
);

gulp.task("parser-covered", () =>
  // This file is not covered here on a purpose.
  // Name *.covered.js is required to autoload from qt.covered.js.
  gulp.src("node_modules/qmlweb-parser/lib/qmlweb.parser.js")
    .pipe(rename("qmlweb.parser.covered.js"))
    .pipe(changed("./tmp"))
    .pipe(gulp.dest("./tmp"))
);

gulp.task("qmlweb-covered", () =>
  gulp.src(sources)
    .pipe(order(sources, { base: __dirname }))
    .pipe(shaker())
    .pipe(babel({
      presets: ["es2015"],
      plugins: ["transform-class-properties", "istanbul"]
    }))
    .pipe(concat("qmlweb.covered.js"))
    .pipe(changed("./tmp"))
    .pipe(replace(/["']use strict["'];/g, ""))
    .pipe(iife({
      useStrict: false,
      params: ["global"],
      args: ["typeof global != \"undefined\" ? global : window"]
    }))
    .pipe(gulp.dest("./tmp"))
);

gulp.task("qmlweb", () =>
  gulp.src(sources)
    .pipe(order(sources, { base: __dirname }))
    .pipe(shaker())
    .pipe(sourcemaps.init())
    .pipe(concat("qmlweb.js"))
    .pipe(changed("./lib"))
    .pipe(babel())
    .pipe(replace(/"use strict";/g, ""))
    .pipe(iife({
      useStrict: false,
      params: ["global"],
      args: ["typeof global != \"undefined\" ? global : window"]
    }))
    .pipe(sourcemaps.write("./"))
    .pipe(gulp.dest("./lib"))
);

gulp.task("qmlweb.es2015", () =>
  gulp.src(sources)
    .pipe(order(sources, { base: __dirname }))
    .pipe(shaker())
    .pipe(sourcemaps.init())
    .pipe(concat("qmlweb.es2015.js"))
    .pipe(changed("./lib"))
    .pipe(babel({
      babelrc: false,
      plugins: ["transform-class-properties"],
      compact: false
    }))
    .pipe(replace(/"use strict";/g, ""))
    .pipe(iife({
      useStrict: false,
      params: ["global"],
      args: ["typeof global != \"undefined\" ? global : window"]
    }))
    .pipe(sourcemaps.write("./"))
    .pipe(gulp.dest("./lib"))
);

gulp.task("qmlweb.min", gulp.series("qmlweb", () =>
  gulp.src("./lib/qmlweb.js")
    .pipe(rename("qmlweb.min.js"))
    .pipe(changed("./lib"))
    .pipe(sourcemaps.init({ loadMaps: true }))
    .pipe(uglify())
    .pipe(sourcemaps.write("./"))
    .pipe(gulp.dest("./lib"))
));

// Legacy library name, TODO: remove
gulp.task("qt", gulp.series("qmlweb", () =>
  gulp.src("./lib/qmlweb.js")
    .pipe(sourcemaps.init({ loadMaps: true }))
    .pipe(concat("qt.js"))
    .pipe(sourcemaps.write("./"))
    .pipe(gulp.dest("./lib"))
));

// Legacy library name, TODO: remove
gulp.task("qt.min", gulp.series("qmlweb.min", () =>
  gulp.src("./lib/qmlweb.min.js")
    .pipe(sourcemaps.init({ loadMaps: true }))
    .pipe(concat("qt.min.js"))
    .pipe(sourcemaps.write("./"))
    .pipe(gulp.dest("./lib"))
));

gulp.task("build-covered", gulp.parallel("parser-covered", "qmlweb-covered"));

gulp.task("build-dev", gulp.parallel("qmlweb", "parser", "license"));

gulp.task("build", gulp.series(
  "build-dev", "qmlweb.min", "qmlweb.es2015", "qt", "qt.min"
));

gulp.task("watch", gulp.series("build", () => {
  gulp.watch(sources, gulp.series(
    "qmlweb", "qmlweb.min", "qmlweb.es2015", "qt", "qt.min"
  ));
  gulp.watch(parserSources, gulp.series("parser"));
  gulp.watch(licenseSources, gulp.series("license"));
}));

gulp.task("watch-dev", gulp.series("build-dev", () => {
  gulp.watch(sources, gulp.series("qmlweb", "qt"));
  gulp.watch(parserSources, gulp.series("parser"));
  gulp.watch(licenseSources, gulp.series("license"));
}));

gulp.task("test", gulp.series("build-dev", done => {
  new karma.Server({
    singleRun: true,
    configFile: path.join(__dirname, "karma.conf.js")
  }, code => {
    done(code);
    process.exit(code);
  }).start();
}));

gulp.task("coverage", gulp.series("build-covered", done => {
  new karma.Server({
    singleRun: true,
    coverageEnabled: true,
    configFile: path.join(__dirname, "karma.conf.js")
  }, code => {
    done(code);
    process.exit(code);
  }).start();
}));

gulp.task("test-watch", gulp.series("watch-dev", done => {
  new karma.Server({
    configFile: path.join(__dirname, "karma.conf.js")
  }, done).start();
}));

gulp.task("default", gulp.series("watch"));
