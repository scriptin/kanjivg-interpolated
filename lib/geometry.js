'use strict';

var
  _ = require('lodash'),
  Bezier = require('bezier-js'),
  expect = require('chai').expect;

function createPoint(x, y) {
  return { x: x, y: y };
}

function roundPoint(p) {
  return {
    x: Math.round(p.x),
    y: Math.round(p.y)
  };
}

function pointToArray(p) {
  return [p.x, p.y];
}

function lineLength(p1, p2) {
  return Math.sqrt(
    Math.pow(p2.x - p1.x, 2) +
    Math.pow(p2.y - p1.y, 2)
  );
}

expect(lineLength(
  { x: -1, y: -1 },
  { x: 2, y: 3 }
)).to.be.equal(5);

expect(lineLength(
  { x: 2, y: 3 },
  { x: -1, y: -1 }
)).to.be.equal(5);

function qBezier(points) {
  return new Bezier(
    points[0].x, points[0].y,
    points[1].x, points[1].y,
    points[2].x, points[2].y
  );
}

function cBezier(points) {
  return new Bezier(
    points[0].x, points[0].y,
    points[1].x, points[1].y,
    points[2].x, points[2].y,
    points[3].x, points[3].y
  );
}

function bezierCurve(type, points) {
  if (type === 'Q') {
    return qBezier(points);
  } else if (type === 'C') {
    return cBezier(points);
  } else {
    throw new Error('Unexpected curve type: ' + type);
  }
}

function getLength(type, points) {
  switch (type) {
    case 'L' : return lineLength(points[0], points[1]);
    case 'Q' : return qBezier(points).length();
    case 'C' : return cBezier(points).length();
    default  : throw new Error('Unexpected line/curve type: ' + type);
  }
}

expect(getLength('L', [createPoint(0, 0), createPoint(1, 1)]).toFixed(4)).to.equal('1.4142');
expect(getLength('L', [createPoint(0, 0), createPoint(10, 0)])).to.equal(10);
expect(getLength('L', [createPoint(0, 0), createPoint(-10, 0)])).to.equal(10);

function getPointOnLine(p1, p2, t) {
  return {
    x: t * (p2.x - p1.x) + p1.x,
    y: t * (p2.y - p1.y) + p1.y
  };
}

expect(getPointOnLine(createPoint(0, 0), createPoint(1, 1), 0.5)).to.deep.equal({ x: 0.5, y: 0.5 });
expect(getPointOnLine(createPoint(10, 10), createPoint(20, 11), 0.5)).to.deep.equal({ x: 15, y: 10.5 });
expect(getPointOnLine(createPoint(-10, -10), createPoint(0, 0), 0.5)).to.deep.equal({ x: -5, y: -5 });
expect(getPointOnLine(createPoint(-10, 10), createPoint(10, -10), 0.5)).to.deep.equal({ x: 0, y: 0 });

function curveToLUT(type, points, step) {
  var curve = bezierCurve(type, points);
  var lutSteps = Math.ceil(getLength(type, points) / (step / 2));
  return curve.getLUT(lutSteps);
}

expect(curveToLUT('C', [
  createPoint(0, 0),
  createPoint(1, 1),
  createPoint(2, 2),
  createPoint(3, 3),
], 1)).to.be.deep.equal([
  { x: 0, y: 0 },
  { x: 0.33333333333333326, y: 0.33333333333333326 },
  { x: 0.6666666666666666, y: 0.6666666666666666 },
  { x: 1.0000000000000002, y: 1.0000000000000002 },
  { x: 1.3333333333333333, y: 1.3333333333333333 },
  { x: 1.666666666666667, y: 1.666666666666667 },
  { x: 2, y: 2 },
  { x: 2.3333333333333335, y: 2.3333333333333335 },
  { x: 2.666666666666667, y: 2.666666666666667 },
  { x: 3, y: 3 }
]);

exports.createPoint = createPoint;
exports.roundPoint = roundPoint;
exports.pointToArray = pointToArray;
exports.lineLength = lineLength;
exports.getLength = getLength;
exports.getPointOnLine = getPointOnLine;
exports.curveToLUT = curveToLUT;
