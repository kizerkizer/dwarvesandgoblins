#!/usr/bin/env bash
set -e
cp src/index.html dist/
cp -r resources dist/
esbuild src/index.ts --bundle --outfile=dist/index.js