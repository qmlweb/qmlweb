var gulp      = require('gulp');
//var g_util    = require('gulp-util');
var g_uglify  = require('gulp-uglify');
var g_concat  = require('gulp-concat');
var g_rename  = require('gulp-rename');

var qtcoreSources = [
      './src/helpers/encapsulate.begin.js',
      './src/qtcore/qml/QMLBinding.js',

      './src/uglify/ast.js',
      './src/uglify/parse.js',
      './src/uglify/utils.js',

      './src/qtcore/qml/lib/parser.js',
      './src/qtcore/qml/lib/process.js',
      './src/qtcore/qml/lib/import.js',

      './src/qtcore/qrc.js',
      './src/qtcore/qt.js',
      './src/qtcore/signal.js',
      './src/qtcore/font.js',
      './src/qtcore/easing.js',
      './src/qtcore/qml/qml.js',
      './src/qtcore/qml/**/*.js',

      './src/qmlweb/**/*.js',
      './src/helpers/encapsulate.end.js'
];

gulp.task('qt', function() {
    return gulp.src(qtcoreSources)
        .pipe(g_concat('qt.js'))
        .pipe(gulp.dest('./lib/'));
});

gulp.task('min-qt', function() {
    return gulp.src('./lib/qt.js')
        .pipe(g_rename('qt.min.js'))
        .pipe(g_uglify())
        .pipe(gulp.dest('./lib/'));
});

gulp.task('copy-js', function() {
    var SRC = './lib/*';
    var DST = '../../flask/static/js/qml3/';
    return gulp.src(SRC)
        .pipe(gulp.dest(DST));
});

gulp.task('default', ['qt', 'min-qt', 'copy-js'], function() {
   //gulp.watch(qtcoreSources, ['qt', 'min-qt', 'copy-js']);
});
