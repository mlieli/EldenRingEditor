import dayjs from 'dayjs'
import { BaseDirectory, exists, createDir } from '@tauri-apps/api/fs'
import { register, unregister, isRegistered } from '@tauri-apps/api/globalShortcut';
import { path } from '@tauri-apps/api';

import { View } from './View.ts'
import { Toast } from '../toast.ts';
import { copydir } from '../copy.ts';

export class ArchiveSave extends View {
    archivePath: string
    archiveBackupPath: string
    toast: Toast
    updateArchiveSelect: Function | undefined;

    constructor(archivePath: string, archiveBackupPath: string) {
        super()
        this.archivePath = archivePath
        this.archiveBackupPath = archiveBackupPath
        this.toast = new Toast()
        this.setSubview('toast-container', this.toast)
        this.mount()
    }

    bindEvents() {
        const input = this.mountedElement.querySelector('#archive-name') as HTMLInputElement
        this.mountedElement.querySelector('#btn-save')!.addEventListener('click', async () => {
            console.log('name is', input.value)
            // 存档
            let name = input.value
            if (name === '') {
                name = dayjs().format('YYYY-MM-DD_HH-mm-ss[_即刻存档]')
            }
            await this.saveArchive(name)
            await this.updateArchiveSelect?.()
            this.toast.show(name, '存档成功')
        })
        this.registerQuickSave()
    }

    async saveArchive(name: string) {
        // 原路径的存档，复制到备份文件夹下
        const dst = await path.join(this.archiveBackupPath, name)
        await copydir(this.archivePath, dst).catch(error => {
            this.toast.show(error)
        })
    }

    async registerQuickSave() {
        const switchElement = this.mountedElement.querySelector('.form-switch .form-check-input') as HTMLInputElement
        const shortcut = 'Ctrl+F12'
        let isr = await isRegistered(shortcut)
        console.log('isr', isr)
        if (isr) {
            await unregister(shortcut)
        }
        await register(shortcut, async () => {
            console.log('触发按键', switchElement.checked)
            // console.log('value', switchElement.value)
            if (!switchElement.checked) {
                return
            }
            // 生成随机名字，然后保存
            // 日期 时间 + 随机字符串
            let s = dayjs().format('YYYY-MM-DD_HH-mm-ss[_即刻存档]')
            await this.saveArchive(s)
            await this.updateArchiveSelect?.()
            this.toast.show(s, '存档成功')
        }).catch(async (error) => {
            console.log('error', error)
            this.toast.show('冲突，按键已被注册！')
        })
    }

    async viewDidMount() {
        super.viewDidMount()
        await this.readLocation()
        // let s = dayjs().format('YYYY-MM-DD_HH-mm-ss[_即刻存档]')
        // await this.saveArchive(s)
    }

    async readLocation(){
        console.log('BaseDirectory', BaseDirectory)
        const input = this.mountedElement.querySelector('#archives') as HTMLInputElement
        input.placeholder = this.archivePath



        const input2 = this.mountedElement.querySelector('#archive-backups') as HTMLInputElement
        input2.value = this.archiveBackupPath
        if (!await exists(this.archiveBackupPath)) {
            await createDir(this.archiveBackupPath)
        }
    }

    html(): string {
        const s = `
        <div class="section p-2">
            <h1 class="display-9 text-start">存档</h1>
            <div class="d-flex gap-4 m-2">
                <div>
                    <label for="archives" class="col-form-label">存档位置</label>
                </div>
                <div class="flex-fill">
                    <input class="form-control" id="archives" type="text" placeholder="" disabled>
                </div>
            </div>
    
            <div class="d-flex gap-4 m-2">
                <div class="col-auto">
                    <label for="archive-backups" class="col-form-label">存档备份位置</label>
                </div>
                <div class="flex-fill">
                    <input class="form-control" id="archive-backups" type="text" placeholder="" disabled>
                </div>
            </div>
    
            <div class="d-flex gap-4 m-2">
                <div class="col-auto">
                    <label for="archive-name" class="col-form-label">存档名称</label>
                </div>
                <div class="flex-fill">
                    <input class="form-control" id="archive-name" type="text" placeholder="如果不填则默认「即刻存档」" >
                </div>
            </div>
            <div class="form-switch m-2 d-flex justify-content-center align-items-center">
                <span class="switch-desc me-2">使用快捷键（Ctrl + F12）存档</span>
                <input class="form-check-input" type="checkbox" checked>
            </div>
            <div class="d-flex justify-content-center">
                <button class="btn btn-primary" type="submit" id="btn-save">save</button>
            </div>
        </div>
        
        <toast-container />
        `
        return s
    }

    protected css(): string {
        const s: string = `
            .switch-desc {
                display: inline-block;
                height: 21px;
                vertical-align: middle;
            }
            .form-switch {
                padding-left: 0;
            }
            .form-switch .form-check-input {
                margin-left: 0;
            }
            div label {
                width: 100px;
            }
        `
        return s
    }
}