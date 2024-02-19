import { copyFile, createDir, exists, readDir } from '@tauri-apps/api/fs';
import { path } from '@tauri-apps/api';


export const copydir = async (source: string, destination: string) => {
    // 读取源目录下所有文件，依次拷贝
    const entries = await readDir(source).catch(error => {
        throw error
    })
    if (!entries) {
        return
    }
    for (const entry of entries) {
        if (entry.children) {
            // console.log('entry', entry)
            let t = entry.path.split(source)
            let dst = await path.join(destination, t[1])
            await copydir(entry.path, dst)
        } else {
            const p1 = await path.join(source, entry.name!)
            const p2 = await path.join(destination, entry.name!)
            if (!await exists(destination)) {
                await createDir(destination, {
                    recursive: true
                })
            }
            await copyFile(p1, p2)
        }
    }
}