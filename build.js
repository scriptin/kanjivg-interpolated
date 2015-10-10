'use strict';

var
  _ = require('lodash'),
  fs = require('fs'),
  rimraf = require('rimraf'),
  sax = require('sax'),
  kanjiVgSvgParser = require('./lib/kanjivg-svg-parser'),
  argv = require('minimist')(process.argv.slice(2));

var
  READ_UTF8 = { encoding: 'utf8', flag: 'r' },
  DIR_IN = './input/',
  // fixed parameters:
  DIR_IN_KANJIVG = DIR_IN + 'kanjivg/kanji/',
  // configurable parameters:
  FILE_IN_KANJI_LIST = argv['list'] || (DIR_IN + 'kanji-list.json'),
  DIR_OUT = argv['output'] || './output/',
  BBOX_SIZE = argv['bbox-size'] ? parserInt(argv['bbox-size'], 10) : 1000,
  PT_DISTANCE = argv['pt-distance'] ? parserInt(argv['pt-distance'], 10) : 10,
  ROUND_FLOATS = argv['round-floats'] || true;

var PARSER_OPTS = {
  targetViewbox: [0, 0, BBOX_SIZE - 1, BBOX_SIZE - 1],
  maxDistanceBetweenPoints: PT_DISTANCE,
  roundFloats: ROUND_FLOATS
};

try {
  console.log('Removing the "' + DIR_OUT + '" directory');
  rimraf.sync(DIR_OUT);
} catch (e) {
  console.error('Failed deleting the "' + DIR_OUT + '" directory: ' + e.message);
}

try {
  console.log('Creating the "' + DIR_OUT + '" directory');
  fs.mkdirSync(DIR_OUT);
} catch (e) {
  console.error('Failed creating the "' + DIR_OUT + '" directory: ' + e.message);
}

console.log('Reading kanji list from "' + FILE_IN_KANJI_LIST + '"');
var kanjiList = JSON.parse(fs.readFileSync(FILE_IN_KANJI_LIST, READ_UTF8));

console.log('building kanji stroke data...');
kanjiList.forEach(function (char, i, kanjiList) {
  if (i % 100 === 0) {
    console.log((100 * i / kanjiList.length).toFixed(2) + '%');
  }

  var charCode = _.padLeft(char.charCodeAt(0).toString(16), 5, '0');
  var svgInFile = DIR_IN_KANJIVG + charCode + '.svg';
  var jsonOutFile = DIR_OUT + charCode + '.json';

  var svg = fs.readFileSync(svgInFile, READ_UTF8);
  var parsedData = kanjiVgSvgParser.parse(svg, PARSER_OPTS);
  fs.writeFileSync(jsonOutFile, JSON.stringify(parsedData));
});
