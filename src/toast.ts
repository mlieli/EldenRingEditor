import { View } from './views/View.ts';

export class Toast extends View {
    constructor() {
        super()
        this.mount()
    }

    show(message: string, title?: string) {
        const toast = this.mountedElement.querySelector('#liveToast')!
        this.mountedElement.querySelector('.toast-body')!.innerHTML = message
        if (title) {
            this.mountedElement.querySelector('.toast-header strong')!.innerHTML = title
        }
        const toastBootstrap = bootstrap.Toast.getOrCreateInstance(toast)
        toastBootstrap.show()
    }

    html(){
        const s: string = `
            <div class="toast-container position-fixed top-50 start-50 translate-middle p-3">
                <div id="liveToast" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
                    <div class="toast-header d-flex">
                        <strong class="flex-fill text-center">错误</strong>
                        <button type="button" class="btn-close position-fixed" data-bs-dismiss="toast" aria-label="Close"></button>
                    </div>
                <div class="toast-body text-center">body</div>
                </div>
            </div>
        `
        return s
    }

    css() {
        const s: string = `
            .toast-container .btn-close {
                right: 28px
            }
        `
        return s
    }
}