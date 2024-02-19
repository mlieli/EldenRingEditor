
export const arrayEquals = (l1: Uint8Array, l2: Uint8Array) => {
    for (let i = 0; i < l1.length; i++) {
        if (l1[i] !== l2[i]) {
            return false
        }
    }
    return true
}
