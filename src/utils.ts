export function replaceBetween(origin: string, startIndex: number, endIndex: number, insertion: string) {
    return origin.substring(0, startIndex) + insertion + origin.substring(endIndex);
}


export async function digestMessage(message: string) {
    const msgUint8 = new TextEncoder().encode(message);                           // encode as (utf-8) Uint8Array
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);           // hash the message
    const hashArray = Array.from(new Uint8Array(hashBuffer));                     // convert buffer to byte array
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join(''); // convert bytes to hex string
    return hashHex;
}


export function withoutDiatricts(str: string) {
    return str.normalize("NFD").replace(/\p{Diacritic}/gu, "")
}
