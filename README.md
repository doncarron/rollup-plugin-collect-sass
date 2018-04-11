
# Rollup Plugin Collect Sass (Modified)

This fork contains a lot of hacks. Use at your own risk!

## Features

- Processes all Sass encountered by Rollup in a single context, in import order.
- Supports `node_modules` resolution, following the same Sass file name resolution algorithm. Importing from, for example, `bootstrap/scss/` Just Works&trade;.
- Optionally dedupes `@import` statements, including from `node_modules`. This prevents duplication of common imports shared by multiple components, promotes encapulation and allows modules to standalone if need be.
- Supports CSS modules mappings.
- Produces a single sass file as output (designed for libraries).

## Installation

```
npm install rollup-plugin-collect-sass --save-dev
```

## Usage

```
import collectSass from 'rollup-plugin-collect-sass'

export default {
    plugins: [
        collectSass({
            ...options
        }),
    ],
}
```

## Options

### `importOnce`

Boolean, if set to `true`, all Sass `@import` statements are deduped after absolute paths are resolved. Default: `false` to match default libsass/Ruby Sass behavior.

#### `extensions`

File extensions to include in the transformer. Default: `['.scss', '.sass']`

### `include`

minimatch glob pattern (or array) of files to include. Default: `['**/*.scss', '**/*.sass']`

### `exclude`

minimatch glob pattern (or array) of files to exclude.

### `extract`

Either a boolean or a string path for the file to extract CSS output to. If boolean `true`, defaults to the same path as the JS output with `.css` extension. Default: `false`

If set to `false`, CSS is injected in to the header with JS.

### `extractPath`

Another way to specify the output path. Ignored if `extract` is falsy.

## License

Copyright (c) 2017 Nathan Cahill

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
