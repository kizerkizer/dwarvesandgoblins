/**
 * Get the milliseconds represented by a time value string like
 * "1h 15m 30s 500ms". Supported units are ms, s, m, h, d for milliseconds,
 * seconds, minutes, hours, and days, respectively. All parts
 * are added together; repeated units allowed. Order of units does not matter.
 * Whitespace is ignored.
 * 
 * So, for example, "1h 15m 5m 45s 30s500ms 250ms 0.5h" would be
 * parsed as 1.5 hours + 20 minutes + 75 seconds + 750 milliseconds, which is
 * 6675750 milliseconds.
 * 
 * @param timeString String representing a time value
 * @returns The number of milliseconds represented by the input string
 * @throws Error if the input string is invalid
 */
export function timeStringToMs (timeString: string) {
    timeString = timeString.trim();
    if (timeString.length === 0) {
        return 0;
    }
    const match = timeString.match(/^(\d+(?:\.\d+)?)(ms|s|m|h|d)/);
    if (!match) {
        throw new Error(`Invalid time value: ${timeString}`);
    }
    const value = parseFloat(match[1]);
    const unit = match[2];
    let ms = 0;
    if (unit === 'ms') {
        ms = value;
    } else if (unit === 's') {
        ms = value * 1000;
    } else if (unit === 'm') {
        ms = value * 60 * 1000;
    } else if (unit === 'h') {
        ms = value * 60 * 60 * 1000;
    } else if (unit === 'd') {
        ms = value * 24 * 60 * 60 * 1000;
    }
    ms += timeStringToMs(timeString.slice(match[0].length));
    return ms;
}

/**
 * Converts a time value in milliseconds to a string representation like 
 * "1h 15m 30s 500ms". Units used are d, h, m, s, and ms for days, hours,
 * minutes, seconds, and milliseconds, respectively.
 * Only nonzero units are included in the output string. 
 * Units are tried from largest to smallest.
 * @param ms The time value in milliseconds
 * @returns A string representation of the time value
 */
export function msToTimeString (ms: number) {
    const parts = [];
    const units = [
        { label: 'd', ms: 24 * 60 * 60 * 1000 },
        { label: 'h', ms: 60 * 60 * 1000 },
        { label: 'm', ms: 60 * 1000 },
        { label: 's', ms: 1000 },
        { label: 'ms', ms: 1 },
    ];
    for (const unit of units) {
        if (ms >= unit.ms) {
            const value = Math.floor(ms / unit.ms);
            parts.push(`${value}${unit.label}`);
            ms -= value * unit.ms;
        }
    }
    return parts.join(' ');
}

console.log(msToTimeString(6675750));
// "2h 15m 15s 750ms"