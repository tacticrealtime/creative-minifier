# Description

Creative minifier does minification of .js, .html/.htm and .css files in creative folder with [uglify-js](https://www.npmjs.com/package/uglify-js), [html-minifier](https://www.npmjs.com/package/html-minifier) and [clean-css](https://www.npmjs.com/package/clean-css). 
It also can replace links in html files in `<script>` and `<link>` tags to minified versions so minified html (for example `index.min.html`) will use minified versions of scripts and styles (for example `creative.min.js` and `styles.min.css`).

# Usage

Justs run `creative-minifier` inside directory of creative.

Parameters description:

Parameter | Value | Description | Optional or mandatory
--- | --- | --- | ---
-g, --globs [additional globs] | Any string | Additional patterns to include or exclude | Optional
-t, --test | N/A | Don't do minification - only print list of files to minify (for quick and easy testing if you specified patterns in `--globs` correctly) | Optional
-r, --replace-links | N/A | Replace relative links to minified versions of files | Optional

:warning: Minifier doesn't replace links in `manifest.json`! If you are using `-r, --replace-links` option be sure to put links to minified html files into your `manifest.json`.

# Installation

This utility should be installed as dev dependency of creative.
Just run `npm install --save-dev github:tacticrealtime/creative-minifier` inside directory of creative.
Then the following script can be added to package.json:
```
"min": "./node_modules/creative-minifier/index.js --replace-links --globs !node_modules/* --globs !editor.html --globs !preview.html",
```
After that you can minify your creative by running `npm run min` command.

If you are using also [creative-packager](https://github.com/tacticrealtime/creative-packager) then you can combine it with minifier by adding these scripts:
```
"zip": "./node_modules/creative-packager/index.js -n $npm_package_name -d",
"minzip": "npm run min && npm run zip"
```
Then running `npm run minzip` will minify and then pack your creative into zip archive.
