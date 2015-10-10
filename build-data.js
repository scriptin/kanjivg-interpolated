'use strict';

var
  _ = require('lodash'),
  fs = require('fs'),
  rimraf = require('rimraf'),
  sax = require('sax'),
  kanjiVgSvgParser = require('./lib/kanjivg-svg-parser');

var READ_UTF8 = { encoding: 'utf8', flag: 'r' };

var
  DIR_IN = './input/',
  DIR_OUT = './output/',
  FILE_IN_KANJI = DIR_IN + 'kanji-list.json',
  DIR_IN_KANJIVG = DIR_IN + 'kanjivg/kanji/',
  DIR_OUT_STROKE_DATA = DIR_OUT;

var kanjiList = JSON.parse(fs.readFileSync(FILE_IN_KANJI, READ_UTF8));

try {
  rimraf.sync(DIR_OUT_STROKE_DATA);
} catch (e) {
  console.error('Failed deleting the "' + DIR_OUT_STROKE_DATA + '" directory: ' + e.message);
}

try {
  fs.mkdirSync(DIR_OUT_STROKE_DATA);
} catch (e) {
  console.error('Failed creating the "' + DIR_OUT_STROKE_DATA + '" directory: ' + e.message);
}

var PARSER_OPTS = {
  targetViewbox: [0, 0, 999, 999],
  maxDistanceBetweenPoints: 10,
  roundFloats: true
};

console.log('building kanji stroke data...');
kanjiList.forEach(function (char, i, kanjiList) {
  if (i % 100 === 0) {
    console.log((100 * i / kanjiList.length).toFixed(2) + '%');
  }
  var charCode = _.padLeft(char.charCodeAt(0).toString(16), 5, '0');
  var svg = fs.readFileSync(DIR_IN_KANJIVG + charCode + '.svg', READ_UTF8);
  var parsedData = kanjiVgSvgParser.parse(svg, PARSER_OPTS);
  fs.writeFileSync(
    DIR_OUT_STROKE_DATA + charCode + '.json',
    JSON.stringify(parsedData)
  );
});
