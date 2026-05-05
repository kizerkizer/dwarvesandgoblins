import { prf32f, prf32n } from './prf';

export interface RNG {
    nextFloat: () => number;
    nextInt: (min: number, max: number) => number;
}

export class BasicRNG implements RNG {
    nextFloat () {
        return Math.random();
    }

    nextInt (min: number, max: number) {
        return Math.floor(this.nextFloat() * (max - min + 1)) + min;
    }
}

export class SeededRNG implements RNG {
    private seed: number;
    private i: number = 0;
    
    constructor (seed: number) {
        this.seed = seed;
    }

    nextFloat () {
        const result = prf32f(this.seed, this.i++);
        return result;
    }

    nextInt (min: number, max: number) {
        const result = prf32n(this.seed, min, max, this.i++);
        return result;
    }
}