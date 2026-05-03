import fs from 'node:fs/promises';
import path from 'node:path';

import sharp from 'sharp';

const manifest = JSON.parse(await fs.readFile(path.join(process.cwd(), 'resources/manifest.json'), 'utf-8'));
const inputDir = path.join(process.cwd(), `resources/`);
const outputDir = path.join(process.cwd(), `resources/atlases`);

async function buildAtlas (directory, dimensions, ...names) {
    const files = (await fs.readdir(directory)).filter(f => f.endsWith('.png') || f.endsWith('.jpg')).sort();

    if (files.length !== dimensions.cols * dimensions.rows) {
        throw new Error(`Expected ${dimensions.cols * dimensions.rows} frames, but found ${files.length}`);
        process.exit(1);
    }

    const composites = files.map((file, i) => ({
        input: path.join(directory, file),
        left: (i % dimensions.cols) * dimensions.frameW,
        top: Math.floor(i / dimensions.cols) * dimensions.frameH,
    }));

    const outputFileName = `${names.join('_')}.png`;
    const outputPath = path.join(outputDir, outputFileName);

    await sharp({
        create: {
            width: dimensions.frameW * dimensions.cols,
            height: dimensions.frameH * dimensions.rows,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 0 },
        },
    })
        .composite(composites)
        .png()
        .toFile(outputPath);
        
    console.log(`Created sprite sheet at ${outputPath}`);

}

async function main () {
    for (const entity of manifest.entities) {
        for (const animation of entity.animations) {
            const dimensions = {
                frameW: animation.frameW,
                frameH: animation.frameH,
                cols: animation.cols,
                rows: animation.rows,
            };
            if (animation.names) {
                for (const name of animation.names) {
                    const dirPath = path.join(inputDir, entity.name, animation.name, name);
                    await buildAtlas(dirPath, dimensions, entity.name, animation.name, name);
                }
            } else {
                const dirPath = path.join(inputDir, entity.name, animation.name);
                await buildAtlas(dirPath, dimensions, entity.name, animation.name);
            }
        }
    }
}

main();