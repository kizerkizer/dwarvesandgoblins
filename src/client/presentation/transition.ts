export interface ITransition<T> {
    from: T;
    to: T;
    push: (end: T) => void;
}

export class Transition<T> implements ITransition<T> {

    public from: T;
    public to: T;

    constructor (from: T, to: T) {
        this.from = from;
        this.to = to;
    }

    public push (to: T) {
        this.from = this.to;
        this.to = to;
    }

}

export function transition<T> (from: T, to: T): Transition<T> {
    return new Transition(from, to);
}