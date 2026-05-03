import { vec2, Vector2 } from "@common/math";
import { ICamera } from "./presentation/presenter/camera";

export const keys: Record<string, boolean> = {
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

export const wheel = {
    hasChanged: false,
    deltaX: 0,
    deltaY: 0,
    deltaZ: 0,
    deltaMode: 0,
};

let _camera: ICamera;

export const mouse = {
    hasChanged: false,
    leftButton: false,
    middleButton: false,
    rightButton: false,
    x: 0,
    y: 0,
    get worldPosition () {
        return screenToWorld(this.x, this.y, _camera);
    }
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

function screenToWorld (x: number, y: number, camera: ICamera): Vector2 {
    const cameraSpaceX = x - camera.width / 2;
    const cameraSpaceY = y - camera.height / 2;
    const worldX = camera.x + cameraSpaceX / camera.zoom;
    const worldY = camera.y + cameraSpaceY / camera.zoom;
    return vec2(worldX, worldY);
}

export function attachEventListeners (camera: ICamera) {
    _camera = camera;
    document.body.addEventListener('keydown', keyHandler(true));
    document.body.addEventListener('keyup', keyHandler(false));
    document.body.addEventListener('wheel', (event: WheelEvent) => {
        wheel.deltaX = event.deltaX;
        wheel.deltaY = event.deltaY;
        wheel.deltaZ = event.deltaZ;
        wheel.deltaMode = event.deltaMode;
        wheel.hasChanged = true;
    });
    document.body.addEventListener('mousemove', (event: MouseEvent) => {
        const x = event.clientX;
        const y = event.clientY;
        mouse.x = x;
        mouse.y = y;
        mouse.hasChanged = true;
    });
    document.body.addEventListener('mousedown', (event: MouseEvent) => {
        if (event.button === 0) {
            mouse.leftButton = true;
        } else if (event.button === 1) {
            mouse.middleButton = true;
        } else if (event.button === 2) {
            mouse.rightButton = true;
        }
        mouse.hasChanged = true;
    });
    document.body.addEventListener('mouseup', (event: MouseEvent) => {
        if (event.button === 0) {
            mouse.leftButton = false;
        } else if (event.button === 1) {
            mouse.middleButton = false;
        } else if (event.button === 2) {
            mouse.rightButton = false;
        }
        mouse.hasChanged = true;
    });
}