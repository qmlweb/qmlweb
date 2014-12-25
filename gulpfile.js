var gulp   = require('gulp');
var gutil  = require('gulp-util');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');

var qtcoreSources = [
  './src/helpers/encapsulate.begin.js',
  './src/qtcore/qml/QMLBinding.js',

  './src/qtcore/lib/parser.js',
  './src/qtcore/lib/process.js',
  './src/qtcore/lib/import.js',

  './src/qtcore.prototype.js',
  './src/qtcore/qrc.js',
  './src/qtcore/qt.js',
  './src/qtcore/signal.js',
  './src/qtcore/font.js',
  './src/qtcore/easing.js',
  './src/qtcore/qml/*.js',
  './src/qtcore/qml/**/*.js',

  './src/qmlweb/**/*.js',
  './src/helpers/encapsulate.end.js'
];

gulp.task('qt', function() {
  return gulp.src(qtcoreSources).pipe(concat('qt.js')).pipe(gulp.dest('./lib'));
});

gulp.task('default', ['qt'],function() {
   gulp.watch(qtcoreSources, ['qt']);
});
