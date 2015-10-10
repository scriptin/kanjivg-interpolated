'use strict';

var
  _ = require('lodash'),
  sax = require('sax'),
  SvgPath = require('svgpath'),
  Bezier = require('bezier-js'),
  geometry = require('./geometry'),
  pt = geometry.createPoint,
  expect = require('chai').expect;

function segmentPoints(segment, x, y) {
  var points = [pt(x, y)];
  for (var i = 1; i < segment.length - 1; i += 2) {
    points.push(pt(segment[i], segment[i + 1]));
  }
  return points;
}

expect(segmentPoints(['C', 1, 1, 2, 2, 3, 3], 0, 0)).to.be.deep.equal([
  { x: 0, y: 0 },
  { x: 1, y: 1 },
  { x: 2, y: 2 },
  { x: 3, y: 3 }
]);

function hvToLine(segment, index, x, y) {
  switch (segment[0]) {
    case 'H' : return [['L', segment[1], y]];
    case 'V' : return [['L', x, segment[1]]];
    default  : return [Array.prototype.slice.call(segment)];
  }
}

function lutToLineSegments(lut) {
  var segments = [];
  for (var i = 1; i < lut.length; i += 1) { // start from 1! first element is a tail of prev. segment
    segments.push(['L', lut[i].x, lut[i].y]);
  }
  return segments;
}

function curveToLine(segment, index, x, y, step) {
  switch (segment[0]) {
    case 'Q':
    case 'C':
      var type = segment[0];
      var points = segmentPoints(segment, x, y);
      var lut = geometry.curveToLUT(type, points, step);
      return lutToLineSegments(lut);
    default: return [Array.prototype.slice.call(segment)];
  }
}

function segmentsToPoints(segments, step) {
  var
    lastSegmentEnd, currentSegmentEnd,
    remainingStep,
    moveToSeen = false,
    points = [];

  segments.forEach(function (segment) {
    var type = segment[0];
    if (type === 'M') {
      if (moveToSeen) {
        throw new Error('Broken path! "M" encountered more than once: ' + JSON.stringify(segments));
      }
      moveToSeen = true;
      currentSegmentEnd = pt(segment[1], segment[2]);
      points.push(currentSegmentEnd);
      remainingStep = step;
    } else if (type === 'L') {
      if (!moveToSeen) {
        throw new Error('Broken path! "L" encountered before "M": ' + JSON.stringify(segments));
      }
      currentSegmentEnd = pt(segment[1], segment[2]);
      var lineLength = geometry.lineLength(lastSegmentEnd, currentSegmentEnd);
      while (remainingStep <= lineLength) {
        points.push(
          geometry.getPointOnLine(lastSegmentEnd, currentSegmentEnd, remainingStep / lineLength)
        );
        remainingStep += step;
      }
      remainingStep -= lineLength;
    } else {
      throw new Error('Unexpected segment type: ' + type);
    }
    lastSegmentEnd = currentSegmentEnd;
  });

  return points;
}

function pathToPoints(pathString, initialViewbox, opts) {
  var
    sx = (opts.targetViewbox[2] - opts.targetViewbox[0]) / (initialViewbox[2] - initialViewbox[0]),
    sy = (opts.targetViewbox[3] - opts.targetViewbox[1]) / (initialViewbox[3] - initialViewbox[1]),
    path = new SvgPath(pathString).abs().scale(sx, sy).unshort().unarc(),
    step = opts.maxDistanceBetweenPoints;

  var segments = path
    .iterate(hvToLine)
    .iterate(_.partialRight(curveToLine, step))
    .segments;
  return segmentsToPoints(segments, step);
}

function parseViewbox(viewboxString) {
  return viewboxString
    .split(/\s*[,]?\s+/g)
    .map(function (numStr) {
      return Number.parseInt(numStr, 10);
    });
}

function createDefaultParser() {
  var parser = sax.parser(false, {
    trim: true,
    normalize: true,
    lowercase: true
  });

  parser.onerror = function (error) {
    console.error(error.message);
    parser.resume();
  };

  return parser;
}

function roundPoints(points) {
  return points.map(geometry.roundPoint);
}

function pointsToArrays(points) {
  return points.map(geometry.pointToArray);
}

function parse(svg, opts) {
  var parsed = [opts.targetViewbox];
  var initialViewbox;

  var parser = createDefaultParser();

  parser.onopentag = function (tag) {
    if (tag.name === 'svg') {
      initialViewbox = parseViewbox(tag.attributes.viewbox);
    } else if (tag.name === 'path') {
      var points =_.flow(
        pathToPoints,
        opts.roundFloats ? roundPoints : _.identity,
        pointsToArrays
      )(tag.attributes.d, initialViewbox, opts);
      parsed.push(points);
    }
  };

  parser.write(svg).close();
  return parsed;
}

exports.parse = parse;
