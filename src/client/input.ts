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