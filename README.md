# KanjiVG interpolated

This is a script which builds interpolated versions of kanji characters from [KanjiVG](https://github.com/KanjiVG/kanjivg) project. "Interpolated" means that SVG paths which describe strokes in original files are converted to plain lists of 2D points, which is useful when you don't have the ability to parse SVG and want a simple way to draw/manipulate kanji in your programs.

## Building

With default configuration:

    npm start

This will build into `output/` directory.

With custom arguments:

    node build.js \
      --list=/path/to/kanji-list.json \
      --output=/path/to/output/dir \
      --bbox-size=1000 \
      --pt-distance-10 \
      --round-floats

where:

- `list` (optional, string) - path to JSON files with a list of characters, see `input/kanji-list.json` for example
- `output` (optional, string) - path to output directory
- `bbox-size` (optional, positive integer) - size of bounding box
- `pt-distance` (optional, positive integer) - maximum distance b/w two adjacent points (along a stroke path, not just euclidean distance)
- `round-floats` (optional flag, no value) - if set, coordinates are rounded, which is useful when you want to produce smaller files

## Format of the result

Output directory contains a set of JSON files, names of which are HEX codes of corresponding kanji characters.

Each file contains a JSON array:

1. First element is a bounding box: `[xmin, ymin, xmax, ymax]`
2. All the rest are strokes, represented as arrays of points, where each point is an array of `[x, y]`
