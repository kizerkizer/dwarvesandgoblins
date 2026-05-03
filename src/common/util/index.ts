let id = 0;

export type GameId = number | string;

export function nextId (): GameId {
    return id++;
}

const toJsonSymbol = Symbol();

export const symbols = {
    toJson: toJsonSymbol,
} as const;
