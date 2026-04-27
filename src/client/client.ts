class Camera {
    constructor (public x: number, public y: number, public width: number, public height: number) {

    }
}

class Vector2d {

    constructor (public x: number, public y: number) {}

    public static Zero = new Vector2d(0, 0);
    public static Up = new Vector2d(0, -1);
    public static Down = new Vector2d(0, 1)
    public static Left = new Vector2d(-1, 0);
    public static Right = new Vector2d(1, 0);

    scale (value: number) {
        return new Vector2d(this.x * value, this.y * value);
    }

    add (vector2d: Vector2d) {
        return new Vector2d(this.x + vector2d.x, this.y + vector2d.y);
    }

    get magnitude () {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    normalize () {
        const magnitude = this.magnitude;
        if (magnitude > 0) {
            return new Vector2d(this.x / magnitude, this.y / magnitude);
        }
        return new Vector2d(0, 0);
    }
}

class Player {
    //public velocity: Vector2d;

    constructor (public position: Vector2d) {}
}

class GridWorld {
    private cells: Uint32Array;

    constructor (private width: number, private height: number) {
        this.cells = new Uint32Array(width * height);
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                this.cells[x * width + y] = 0;
            }
        }
    }
}

type WorldUnit = number & { __brand: never };

function worldUnit (n: number): WorldUnit {
    return n as WorldUnit;
}

const foo: WorldUnit = worldUnit(5);

const speed = 12,
    speedDiagonal = 17,
    unitGranularity = 128, // Units per cell length
    interval = 50;

function worldUnitToCellUnit (n: WorldUnit) {
    return n % unitGranularity;
}

const keys: Record<string, boolean> = {
    'a': false,
    'b': false,
    'c': false,
    'd': false,
    'e': false,
    'f': false,
    'g': false,
    'h': false,
    'i': false,
    'j': false,
    'k': false,
    'l': false,
    'm': false,
    'n': false,
    'o': false,
    'p': false,
    'q': false,
    'r': false,
    's': false,
    't': false,
    'u': false,
    'v': false,
    'w': false,
    'x': false,
    'y': false,
    'z': false,
    'enter': false,
    'shift': false,
    'space': false,
    'backspace': false,
    'alt': false,
    'meta': false,
    'control': false,
    '0': false,
    '1': false,
    '2': false,
    '3': false,
    '4': false,
    '5': false,
    '6': false,
    '7': false,
    '8': false,
    '9': false,
    '!': false,
    '@': false,
    '#': false,
    '$': false,
    '%': false,
    '^': false,
    '&': false,
    '*': false,
    '(': false,
    ')': false,
    '_': false,
    '+': false,
    '-': false,
    '=': false,
    '[': false,
    ']': false,
    '\\': false,
    ';': false,
    '\'': false,
    ',': false,
    '.': false,
    '/': false,
    '`': false,
    'up': false,
    'down': false,
    'left': false,
    'right': false,
};

function keyHandler (value: boolean): (event: KeyboardEvent) => void {
    return (event: KeyboardEvent) => {
        if (event.shiftKey) {
            keys['shift'] = value;
        }
        if (event.altKey) {
            keys['alt'] = value;
        }
        if (event.metaKey) {
            keys['meta'] = value;
        }
        if (event.ctrlKey) {
            keys['control'] = value;
        }
        if (event.key === ' ') {
            keys['space'] = value;
        } else if (event.key === 'LeftArrow') {
            keys['left'] = value;
        } else if (event.key === 'RightArrow') {
            keys['right'] = value;
        } else if (event.key === 'UpArrow') {
            keys['up'] = value;
        } else if (event.key === 'DownArrow') {
            keys['down'] = value;
        } else {
            keys[event.key.toLowerCase()] = value;
        }
    };
}

document.body.addEventListener('keydown', keyHandler(true));

document.body.addEventListener('keyup', keyHandler(false));

let lastTimestamp = performance.now();

function rafLoop (timestamp: DOMHighResTimeStamp) {
    requestAnimationFrame(rafLoop);
    const dt = timestamp - lastTimestamp;
    lastTimestamp = timestamp;
    loop(dt);
    render(dt);
}

let accumulator = 0;

function loop (dt: number) {
    accumulator += dt;
    while (accumulator >= interval) {
        tick();
        accumulator -= interval;
    }
}

function tick () {

}

function render (dt: number) {
    // Render the game state here
}