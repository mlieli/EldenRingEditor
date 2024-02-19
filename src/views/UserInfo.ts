

import { View } from './View.ts'
import { Toast } from '../toast.ts';
import { getBigEndianBytes } from '../endian.ts';
import {sep} from "@tauri-apps/api/path";

export class UserInfo extends View {
    appDataDir: string
    steamId: string
    steamId64: number[]
    archiveSteamId: string|undefined
    toast: Toast


    constructor(appDataDir: string) {
        super()

        this.appDataDir = appDataDir
        const index = appDataDir.lastIndexOf(sep)
        console.log('index', index, appDataDir.slice(index+1))
        this.steamId = appDataDir.slice(index+1) || '76561198865732908'
        this.steamId64 = getBigEndianBytes(BigInt(this.steamId))
        // console.log('steamId64', this.steamId64)
        this.toast = new Toast()
        this.mount()
    }

    protected viewDidMount() {
        super.viewDidMount()
        const input = this.mountedElement.querySelector('.form-control') as HTMLInputElement
        input.value = this.steamId
    }

    bindEvents() {

    }

    html(): string {
        console.log('html in userinfo', this.steamId)
        if (this.steamId === this.archiveSteamId) {
            return ''
        }
        let s: string = `
        <div class="d-flex gap-4 m-2">
            <span class="d-flex align-items-center">
                当前存档的SteamId
            </span>
            <div>
                <input class="form-control" id="archives" type="text" placeholder="" disabled value="${this.steamId}">
            </div>
        </div>
        `
        if (this.archiveSteamId) {
            s += `
                <div class="d-flex gap-4 m-2">
                    <span class="d-flex align-items-center">
                        将要加载的SteamId
                    </span>
                    <div>
                        <input class="form-control" id="archives" type="text" placeholder="" disabled value="${this.archiveSteamId}">
                    </div>
                </div>`
        }
        return s
    }
}