export const getBigEndianBytes = (number: bigint) => {
    const l = []
    for (let i = 0; i < 8; i++) {
        const byte = (number >> (BigInt(i*8))) & 0xffn
        l.push(byte)
    }
    return l.map(e => Number(e))
}