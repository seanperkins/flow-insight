const gulp = require("gulp");
const prettyHtml = require("gulp-pretty-html");

module.exports = function () {
  return function () {
    var stream = gulp
      .src([
        "./gulp/**/*.html",
        "./public/**/*.html",
        "!./public/assets/**/*",
        "./src/**/*.html",
        "./server/**/*.html",
        "./test/**/*.html",
        "./docs/**/*.html",
      ])
      .pipe(
        prettyHtml({
          indent_size: 2,
          preserve_newlines: false,
          wrap_attributes: "force-aligned",
          indent_scripts: "keep",
        })
      )
      .pipe(gulp.dest((file) => file.base));
    return stream;
  };
};
