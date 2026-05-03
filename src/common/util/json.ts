import { symbols } from '@common/util/index';

export function stringify (value: JSONObject, space?: string | number) {
    return JSON.stringify(value, (key, value) => {
        if (typeof value === 'object' && value !== null && symbols.toJson in value) {
            return value[symbols.toJson]();
        }
        return value;
    }, space);
}

export function parse (text: string): JSONObject {
    return JSON.parse(text);
}

export type JSONValue =
  | string
  | number
  | boolean
  | null
  | JSONObject
  | JSONValue[];

export type JSONObject = { [key: string]: JSONValue };