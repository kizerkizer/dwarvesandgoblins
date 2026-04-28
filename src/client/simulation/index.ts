// TODO

////////////////////////////////////////////////////////////////////////////////

let lastTimestamp = performance.now();

function rafLoop (timestamp: DOMHighResTimeStamp) {
    requestAnimationFrame(rafLoop);
    const dt = timestamp - lastTimestamp;
    lastTimestamp = timestamp;
    const progress = loop(dt);
    const dt2 = performance.now() - timestamp;
    //render(progress, dt, dt2);
}

const interval = 50; // ms
let accumulator = 0;

function loop (dt: number) {
    accumulator += dt;
    while (accumulator >= interval) {
        //tick();
        accumulator -= interval;
    }
    return accumulator / interval;
}