'use strict';

function _interopDefault$1 (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var fs = _interopDefault$1(require('fs'));
var path = _interopDefault$1(require('path'));
var resolve = _interopDefault$1(require('resolve'));
var styleInject = _interopDefault$1(require('style-inject'));
var rollupPluginutils = require('rollup-pluginutils');

var ESCAPED_END_COMMENT_FLAG = 'collect-postcss-escaped-end * /';
var importRegex = new RegExp('@import([^;]*);', 'g');

var importExtensions = ['.scss', '.sass'];
var injectFnName = '__$styleInject';
var injectStyleFuncCode = styleInject
    .toString()
    .replace(/styleInject/, injectFnName);

var index = function (options) {
    if ( options === void 0 ) { options = {}; }

    var extensions = options.extensions || importExtensions;
    var filter = rollupPluginutils.createFilter(options.include || ['**/*.scss', '**/*.sass'], options.exclude);
    var extract = Boolean(options.extract);
    var classNameMap = options.classNameMap;
    var extractPath = typeof options.extract === 'string' ? options.extract : null;
    var importOnce = Boolean(options.importOnce);

    var cssExtract = '';
    var sassExtract = {};
    var visitedImports = new Set();

    return {
        name: 'collect-sass',
        intro: function intro () {
            if (extract) {
                return null
            }

            return injectStyleFuncCode
        },
        transform: function transform (code, id) {
            var this$1 = this;

            if (!filter(id)) { return null }
            if (extensions.indexOf(path.extname(id)) === -1) { return null }

            var relBase = path.dirname(id);
            var fileImports = new Set([id]);
            visitedImports.add(id);

            // Resolve imports before lossing relative file info
            // Find all import statements to replace
            var transformed = code.replace(importRegex, function (match, p1) {
                var paths = p1.split(/[,]/).map(function (p) {
                    var orgName = p.trim();  // strip whitespace
                    var name = orgName;

                    if (name[0] === name[name.length - 1] && (name[0] === '"' || name[0] === "'")) {
                        name = name.substring(1, name.length - 1);  // string quotes
                    }

                    // Exclude CSS @import: http://sass-lang.com/documentation/file.SASS_REFERENCE.html#import
                    if (path.extname(name) === '.css') { return orgName }
                    if (name.startsWith('http://')) { return orgName }
                    if (name.startsWith('url(')) { return orgName }

                    var fileName = path.basename(name);
                    var dirName = path.dirname(name);

                    // libsass's file name resolution: https://github.com/sass/node-sass/blob/1b9970a/src/libsass/src/file.cpp#L300
                    if (fs.existsSync(path.join(relBase, dirName, fileName))) {
                        var absPath = path.join(relBase, name);

                        if (importOnce && visitedImports.has(absPath)) {
                            return null
                        }

                        visitedImports.add(absPath);
                        fileImports.add(absPath);
                        return ("'" + absPath + "'")
                    }

                    if (fs.existsSync(path.join(relBase, dirName, ("_" + fileName)))) {
                        var absPath$1 = path.join(relBase, ("_" + name));

                        if (importOnce && visitedImports.has(absPath$1)) {
                            return null
                        }

                        visitedImports.add(absPath$1);
                        fileImports.add(absPath$1);
                        return ("'" + absPath$1 + "'")
                    }

                    for (var i = 0; i < importExtensions.length; i += 1) {
                        var absPath$2 = path.join(relBase, dirName, ("_" + fileName + (importExtensions[i])));

                        if (fs.existsSync(absPath$2)) {
                            if (importOnce && visitedImports.has(absPath$2)) {
                                return null
                            }

                            visitedImports.add(absPath$2);
                            fileImports.add(absPath$2);
                            return ("'" + absPath$2 + "'")
                        }
                    }

                    for (var i$1 = 0; i$1 < importExtensions.length; i$1 += 1) {
                        var absPath$3 = path.join(relBase, ("" + name + (importExtensions[i$1])));

                        if (fs.existsSync(absPath$3)) {
                            if (importOnce && visitedImports.has(absPath$3)) {
                                return null
                            }

                            visitedImports.add(absPath$3);
                            fileImports.add(absPath$3);
                            return ("'" + absPath$3 + "'")
                        }
                    }

                    var nodeResolve;

                    try {
                        nodeResolve = resolve.sync(path.join(dirName, ("_" + fileName)), { extensions: extensions });
                    } catch (e) {} // eslint-disable-line no-empty

                    try {
                        nodeResolve = resolve.sync(path.join(dirName, fileName), { extensions: extensions });
                    } catch (e) {} // eslint-disable-line no-empty

                    if (nodeResolve) {
                        if (importOnce && visitedImports.has(nodeResolve)) {
                            return null
                        }

                        visitedImports.add(nodeResolve);
                        fileImports.add(nodeResolve);
                        return ("'" + nodeResolve + "'")
                    }

                    this$1.warn(("Unresolved path in " + id + ": " + name));

                    return orgName
                });

                var uniquePaths = paths.filter(function (p) { return p !== null; });

                if (uniquePaths.length) {
                    return ("@import " + (uniquePaths.join(', ')) + ";")
                }

                return ''
            });

            // Escape */ end comments
            var extract = transformed.replace(/\*\//g, ESCAPED_END_COMMENT_FLAG);
            sassExtract[id] = extract;

            // Add sass imports to bundle as JS comment blocks
            return {
                code: code,
                map: { mappings: '' },
                dependencies: Array.from(fileImports),
            }
        },
        
        onwrite: function onwrite (opts) {

            return new Promise(function (resolveExtract, rejectExtract) {
                var finalSass = '';

                for (var sassKey in sassExtract) {
                    var sass = sassExtract[sassKey];
                    var relevantClasses = classNameMap[sassKey];

                    for (var classKey in relevantClasses) {
                        sass = sass.replace("." + classKey, "." + relevantClasses[classKey]);                       
                    }

                    finalSass += sass + "\n\n";
                }

                sassExtract = {};
                classNameMap = {};

                var destPath = extractPath || path.join(path.dirname(opts.dest), ((path.basename(opts.dest, path.extname(opts.dest))) + ".scss"));

                fs.writeFile(destPath, finalSass, function (err) {
                    if (err) { rejectExtract(err); }
                    resolveExtract();
                });
            })

            return null
        },
    }
};

module.exports = index;
