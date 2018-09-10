#!/usr/bin/env node
'use strict';

const program = require('commander');

const addGlob = (value, globs) => {
	globs.push(value);
	return globs;
};

program
	.version(require('./package.json').version)
	.option('-g, --globs [additional globs]', 'Additional patterns to include or exclude (optional)', addGlob, [])
	.option('-r, --replace-links', 'Replace relative links to minified versions of files')
	.option('-t, --test', 'Only print list of files to minify instead of doing minification')
	.parse(process.argv);

const fs = require('fs-extra');
const path = require('path');
const UglifyJS = require('uglify-js');
const MinifyHTML = require('html-minifier');
const CleanCSS = require('clean-css');
const globby = require('globby');
const cleanCSS = new CleanCSS({});
const cheerio = require('cheerio');

const absoluteURLRegExp = new RegExp('^(?:[a-z]+:)?//', 'i'); // https://stackoverflow.com/a/19709846
const isRelativeURL = (url) => {
	return !absoluteURLRegExp.test(url);
};

const needMinificationRegExp = new RegExp('(\.min)\.(js|css|html|htm)$');
const isMinificationNeeded = (url) => {
	return needMinificationRegExp.test(url);
};

const minPath = (filepath) => {
	const ext = path.extname(filepath);
	const filename = path.basename(filepath, ext) + '.min' + ext;
	return path.join(path.dirname(filepath), filename);
};

const makeRelativeAttr = (node, attr) => {
	const old_src = node.attr(attr);
	if (old_src && isRelativeURL(old_src) && isMinificationNeeded(old_src)) {
		const new_src = minPath(old_src);
		node.attr(attr, new_src);
		console.log('Replaced URL: ' + old_src + ' to ' + new_src);
	}
};

const minifyHTML = (rawCode, replaceLinks = false) => {
	if (replaceLinks) {
		const $ = cheerio.load(rawCode);

		$('script').each(function() {
			makeRelativeAttr($(this), 'src');
		});

		$('link').each(function() {
			makeRelativeAttr($(this), 'href');
		});

		rawCode = $.html();
	}

	return MinifyHTML.minify(rawCode, {
		minifyCSS: true,
		minifyJS: true,
		removeAttributeQuotes: true,
		removeComments: true,
		collapseWhitespace: true
	});
};

const minifyJS = (rawCode) => {
	const minCode = UglifyJS.minify(rawCode);
	if (minCode.error) {
		throw new Error(minCode.error);
	}
	return minCode.code;
};

const minifyCSS = (rawCode) => {
	return cleanCSS.minify(rawCode).styles;
};

const minifyFunction = {
	'.html': minifyHTML,
	'.htm': minifyHTML,
	'.js': minifyJS,
	'.css': minifyCSS
};

const minifyCreative = (globs, replaceLinks = false, test = false) => {

	const defaultGlobs = ['**/*.js', '**/*.html', '**/*.css', '!**/*.min.js', '!**/*.min.html', '!**/*.min.css', '!**/node_modules'];

	globby(defaultGlobs.concat(globs)).then(files => {
		if (test) {
			console.log(files);
			return;
		}

		Promise.all(files.map(file => fs.readFile(file, 'utf8').then(data => {
			if (!data) {
				console.warn('File is empty or cannot be read: ' + file);
				return;
			}

			const extname = path.extname(file);
			const minCode = minifyFunction[extname](data, replaceLinks);
			return fs.writeFile(minPath(file), minCode);
		}))).catch(error => {
			console.error(error);
		});
	});

};

minifyCreative(program.globs, program.replaceLinks, program.test);