import { type JSONObject, parse, stringify } from "@common/util/json";

const decoder = new TextDecoder(),
    encoder = new TextEncoder();

export function encodeMessage (message: JSONObject): Uint8Array {
    return encoder.encode(stringify(message));
}

export function decodeMessage (data: Uint8Array): JSONObject {
    return parse(decoder.decode(data));
}