import { md5 } from 'js-md5';
// import { readBinaryFile } from '@tauri-apps/api/fs';


import { CHECKSUM_LENGTH, STEAMID_OFFSET, SAVEDATA_LENGTH, HEADER_LENGTH, SAVEDATA_SLOT } from "./constant.ts";
import { arrayEquals } from "./arrayUtils.ts";


export const rehash = ( file: Uint8Array, offset: number, dataLength: number) => {
    const d = file.slice(offset+CHECKSUM_LENGTH, offset+dataLength)
    const data = md5.array(d)
    // console.log('file before', file.slice(offset, offset+10))
    // console.log('data', data.slice(0, 10))
    for (let i = 0; i < data.length; i++) {
        file[i+offset] = data[i]
    }
    // console.log('file after', file.slice(offset, offset+10))
}

export const getSteamID64Offsets = (file: Uint8Array, oldSteamId64: Uint8Array) => {
    let l = [STEAMID_OFFSET]
    for (let slotIndex = 0; slotIndex < SAVEDATA_SLOT; slotIndex++) {
        const offset = slotIndex * SAVEDATA_LENGTH + HEADER_LENGTH
        const data = file.slice(offset, offset+SAVEDATA_LENGTH)
        for (let i = 0x200000; i <= data.length - 8; i += 1) {
            let sub = data.slice(i, i+8)
            // console.log('sub', sub, oldSteamId64)
            if (arrayEquals(sub, oldSteamId64)) {
                l.push(i+offset)
                break
            }
        }
    }
    console.log('l is', l)
    return l
}