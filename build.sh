#!/usr/bin/env bash
set -e
cp src/index.html dist/
cp -r resources dist/
esbuild src/client/index.ts --bundle --loader:.wgsl=text --outfile=dist/index.js