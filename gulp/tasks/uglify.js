const gulp = require("gulp");
const rename = require("gulp-rename");
const uglify = require("gulp-uglify-es").default;
const pkg = require("../../package");
const config = pkg.uglify;

module.exports = function() {
  return function() {
    var stream = gulp
      .src("build/electron.bundle.js")
      .pipe(
        uglify(config).on("error", function(e) {
          console.log(e);
        })
      )
      .pipe(rename("net.twilightcity.desktop.dat"))
      .pipe(gulp.dest("build"));
    return stream;
  };
};
