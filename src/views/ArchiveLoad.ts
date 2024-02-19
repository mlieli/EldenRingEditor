import { createDir, exists, readBinaryFile, readDir, writeBinaryFile } from '@tauri-apps/api/fs'
import { path } from '@tauri-apps/api';


import { View } from './View.ts'
import { Toast } from '../toast.ts';
import { copydir } from '../copy.ts';
import {
    FOOTER_LENGTH,
    FOOTER_OFFSET,
    HEADER_LENGTH,
    SAVEDATA_LENGTH,
    SAVEDATA_SLOT,
    STEAMID_OFFSET
} from "../constant.ts";
import { getSteamID64Offsets, rehash } from "../sl2.ts";
import { UserInfo } from './UserInfo.ts';
import {sep} from "@tauri-apps/api/path";

export class ArchiveLoad extends View {
    archivePath: string
    archiveBackupPath: string
    toast: Toast
    userInfo: UserInfo
    steamFolderPath: string|undefined
    archiveSteamId: string|undefined
    archiveSteamId64: Uint8Array | undefined
    appDataDir: string
    loading: boolean=false

    constructor(archivePath: string, archiveBackupPath: string, appDataDir: string) {
        super()

        this.archivePath = archivePath
        this.archiveBackupPath = archiveBackupPath
        this.appDataDir = appDataDir
        this.userInfo = new UserInfo(appDataDir)
        this.setSubview('.steam-info', this.userInfo)
        this.toast = new Toast()
        this.setSubview('toast-container', this.toast)
        this.mount()
    }



    bindEvents() {
        this.mountedElement.querySelector('select')!.addEventListener('change', async (event) => {
            const self = event.target as HTMLSelectElement
            this.userInfo.update()
            // console.log('changed', self.value)
            const folderName = self.value
            if (folderName === '请选择存档') {
                return
            }
            const p = await path.join(this.archiveBackupPath, folderName)
            const steamFolder = (await readDir(p)).filter(l => l.children)
            this.steamFolderPath = steamFolder[0].path
            this.archiveSteamId = this.steamFolderPath.slice(this.steamFolderPath.lastIndexOf(sep)+1)
            // console.log('this.archiveSteamId', this.archiveSteamId)
            this.renderArchiveSteamId()
        })

        this.mountedElement.querySelector('.btn-load')!.addEventListener('click', async () => {
            if (this.loading) {
                return
            }
            this.loading = true;
            (this.mountedElement.querySelector('.btn-load') as HTMLButtonElement).disabled = true
            await this.loadArchive()
            const sel = this.mountedElement.querySelector('#id-form-select') as HTMLSelectElement
            this.toast.show(sel.value, '读档成功');
            this.loading = false;
            (this.mountedElement.querySelector('.btn-load') as HTMLButtonElement).disabled = false
        })
    }

    async loadArchive() {
        const sel = this.mountedElement.querySelector('#id-form-select') as HTMLSelectElement
        if (sel.value === '请选择存档') {
            return
        }
        if (this.userInfo.steamId === this.archiveSteamId) {
            const source = await path.join(this.archiveBackupPath, sel.value)
            await copydir(source, this.archivePath)
        } else {
            // 加载别人的存档
            await this.loadOtherArchive()
        }
    }

    async loadOtherArchive() {
        if (!this.steamFolderPath) {
            return
        }
        const filePath = await path.join(this.steamFolderPath, 'ER0000.sl2')
        console.log('filepath', filePath)
        let file = await readBinaryFile(filePath)
        // console.log('f', file)
        this.archiveSteamId64 = file.slice(STEAMID_OFFSET, STEAMID_OFFSET+8)
        const offsets = getSteamID64Offsets(file, this.archiveSteamId64)
        // console.log('offset', offsets)
        for (const offset of offsets) {
            for (let i = 0; i < 8; i++) {
                file[i+offset] = this.userInfo.steamId64[i]
            }
        }
        rehash(file, FOOTER_OFFSET, FOOTER_LENGTH)
        for (let slotIndex = 0; slotIndex < SAVEDATA_SLOT; slotIndex++) {
            let offset = slotIndex * SAVEDATA_LENGTH + HEADER_LENGTH;
            rehash(file, offset, SAVEDATA_LENGTH)
        }
        const dstSL2Path = await path.join(this.archivePath, this.userInfo.steamId, 'ER0000.sl2')
        await writeBinaryFile(dstSL2Path, file).catch(error => {
            this.showToast(error, '文件写入失败')
        })
    }

    showToast(message: string, title?: string) {
        this.toast.show(message, title)
    }


    async viewDidMount() {
        super.viewDidMount()
        await this.readArchive()
    }


    readArchive = async () => {
        if (!await exists(this.archiveBackupPath)) {
            await createDir(this.archiveBackupPath, {
                recursive: true
            })
        }
        const entries = await readDir(this.archiveBackupPath)
        const list = entries.filter(e => e.children).map(e => {
            return e.name || '名字为空'
        })
        this.mountedElement.querySelector('#id-form-select')!.innerHTML = `
            <option selected>请选择存档</option>
            ${list.map(e => {
                return `<option>${e}</option>`
            })}
        `
    }

    html(): string {
        const s: string = `
        <div class="section p-2">
            <h1 class="display-9 text-start">读档</h1>
            <div class="input-group gap-2">
                <select id="id-form-select" class="form-select" aria-label="Example select with button addon"
                >
                      <option selected>请选择存档</option>
                </select>
                <button class="btn-load btn btn-outline-primary" type="submit">load</button>
            </div>
            <div class="steam-info"></div>
        </div>
        <toast-container />
        `
        return s
    }

    renderArchiveSteamId() {
        this.userInfo.archiveSteamId = this.archiveSteamId
        this.userInfo.update()
    }



    css(): string {
        const s: string = `
            .btn-load {
                border-radius: 13px !important;
            }
        `
        return s
    }
}