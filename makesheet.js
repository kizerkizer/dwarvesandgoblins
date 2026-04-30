import fs from 'node:fs/promises';
import path from 'node:path';

import sharp from 'sharp';

const inputDir = path.join(process.cwd(), 'resources/tiletextures/');
const outputFile = path.join(process.cwd(), 'resources/tileatlas.png');

const frameW = 256,
    frameH = 256,
    cols = 2,
    rows = 2;

async function main () {
    const files = (await fs.readdir(inputDir)).filter(f => f.endsWith('.png') || f.endsWith('.jpg')).sort();

    if (files.length !== cols * rows) {
        throw new Error(`Expected ${cols * rows} frames, but found ${files.length}`);
        process.exit(1);
    }

    const composites = files.map((file, i) => ({
        input: path.join(inputDir, file),
        left: (i % cols) * frameW,
        top: Math.floor(i / cols) * frameH,
    }));

    await sharp({
        create: {
            width: frameW * cols,
            height: frameH * rows,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 0 },
        },
    })
        .composite(composites)
        .png()
        .toFile(outputFile);
        
    console.log(`Created sprite sheet at ${outputFile}`);
}

main();