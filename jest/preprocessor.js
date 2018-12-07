var babel = require("babel-core");
var babelJest = require("babel-jest");
require("@babel/register");
var jison = require("jison");
var path = require("path");
var webpackAlias = require("jest-webpack-alias");

const tsc = require("typescript");
const tsConfig = require("../tsconfig.json");

module.exports = {
  // Gets called by jest during test prep for every module.
  // src is the raw module content as a String.
  process(src, filename) {
    var isJISON = filename.match(/\.jison$/i);
    // Don't bother doing anything to node_modules
    if (
      filename.indexOf("node_modules") === -1 ||
      filename.indexOf("node_modules/dcos-dygraphs") > -1
    ) {
      // Don't load image data - it can't be parsed by jest.
      if (filename.match(/\.(jpe?g|png|gif|bmp|svg|less|raml)$/i)) {
        return "";
      }
      if (filename.endsWith(".ts") || filename.endsWith(".tsx")) {
        src = tsc.transpile(src, tsConfig.compilerOptions, filename, []);
      }
      // Use JISON generator for JISON grammar
      if (isJISON) {
        src = new jison.Generator(src).generate();
      }
      // Run our modules through Babel before running tests
      if (
        isJISON ||
        filename.endsWith(".ts") ||
        filename.endsWith(".tsx") ||
        babel.DEFAULT_EXTENSIONS.indexOf(path.extname(filename)) !== -1
      ) {
        src = babel.transform(src, {
          auxiliaryCommentBefore: " istanbul ignore next ",
          filename,
          plugins: [
            "@babel/plugin-transform-runtime",
            "@babel/plugin-syntax-dynamic-import",
            ["@babel/plugin-proposal-class-properties", { "loose": false }],
            "@babel/plugin-syntax-import-meta",
            "@babel/plugin-proposal-json-strings",
            "macros"
          ],
          presets: [
            ["@babel/preset-env", { "modules": "commonjs"}],
            "@babel/preset-react",
            "@babel/preset-typescript"
          ],
          retainLines: true
        }).code;
      }
      src = webpackAlias.process(src, filename);
    }

    return src;
  }
};
