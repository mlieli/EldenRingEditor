import { path } from '@tauri-apps/api';


import { ArchiveSave } from './views/ArchiveSave.ts';
import { ArchiveLoad } from './views/ArchiveLoad.ts';

const __main = async () => {
    const dataDir = await path.appDataDir()
    const p1 = await path.join(dataDir, 'EldenRing')
    const p2 = await path.join(dataDir, 'EldenRing_backup')
    console.log('p1', p1)
    const archiveSave = new ArchiveSave(p1, p2)
    archiveSave.render(document.querySelector('archive-save')!)
    const archiveLoad = new ArchiveLoad(p1, p2, dataDir)
    archiveLoad.render(document.querySelector('archive-load')!)
    archiveSave.updateArchiveSelect = archiveLoad.readArchive
}

__main().then(null)