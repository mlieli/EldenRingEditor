class IDManager {
    static IDMap = new Map()

    static next(identifier: string): string {
        let v = this.IDMap.get(identifier)
        if (v === undefined) {
            v = 0
        } else {
            v++
        }
        this.IDMap.set(identifier, v)
        return `${identifier}_${v}`
    }
}

export class View {
    // 组件对应的id, 挂载到元素的dataset.id上
    // 元素没有dataset.id即还没有调用mount方法, mount后会给元素添加dataset.id属性
    // @ts-ignore
    private id: string
    // view 挂载的dom元素
    public mountedElement: HTMLElement
    private subViewMountRelationMap: Map<string, View[]>
    /*
    记录html内容挂载的标签
     */
    private mountedSelector: string | undefined
    private eventDelegateMap = new Map()
    /*
    view的父组件
     */
    protected parent: View | undefined

    /*
    子类constructor方法的最后一定要调用mount()方法, 用来将待显示内容挂载到this.mountedElement
     */
    constructor() {
        this.subViewMountRelationMap = new Map()
        this.mountedElement = document.createElement('view')
        let id = IDManager.next(this.constructor.name)
        this.mountedElement.dataset.id = id
    }

    /***
     * 将要显示的html内容(包含子组件的)插入到this.mountedElement
     * warning: 不会把页面内容显示到页面上
     */
    protected mount() {
        this.mountSelf()

        this.relateSubViewToHTML()

        this.viewDidMount()
    }

    // 将子组件挂载到this.mountedElement, 是否显示取决于this.mountedElement是否显示
    private relateSubViewToHTML() {
        this.subViewMountRelationMap.forEach((value, key) => {
            let container = this.mountedElement.querySelector(key) as HTMLElement
            let nodes = value.map((item) => {
                return item.mountedElement
            })
            container.replaceChildren(...nodes)
        })
    }

    /***
     * 将组件渲染到container元素上
     * @param container: 渲染组件的目标元素
     */
    public render(container: HTMLElement) {
        container.replaceChildren(this.mountedElement)
    }

    private mountSelf() {
        this.insertHTML()
        this.insertCss()
        this.bindEvents()
    }

    /*
    更新内容
    1. html
    2. event
    3. 子组件
     */
    // 父组件可能要调用子组件 update，所以这里是 public
    update() {
        this.insertHTML()
        this.bindEvents()
        this.relateSubViewToHTML()

        // 自动调用update
        this.subViewMountRelationMap.forEach((value) => {
            for (const v of value) {
                v.update()
            }
        })
    }

    /***
     * 设置子组件和当前组件html的对应关系
     * @protected
     * @param selector 子组件要显示的位置
     * @param view 子组件的内容, 可以是单个子组件也可以是一个子组件列表
     */
    protected setSubview(selector: string, view: View | View[]) {
        let v = view
        if (v instanceof View) {
            v = [v]
        }

        for (let i = 0; i < v.length; i++) {
            v[i].mountedSelector = selector
            v[i].parent = this
        }
        this.subViewMountRelationMap.set(selector, v)
    }

    protected html(): string {
        return 'View default'
    }

    // 如果有css，注入到head里面
    private insertCss() {
        let noCss = this.css().length == 0

        if (noCss) {
            return
        }
        const style = document.createElement('style')
        style.innerHTML = this.css()
        document.head.appendChild(style)
    }


    // 把组件的html插入到dom标签里
    // 这个操作就是挂载的实际行为
    private insertHTML() {
        let s = this.html()
        let container = this.mountedElement as HTMLElement
        container.innerHTML = s
    }

    protected css(): string {
        return ''
    }

    // 在这个函数里绑定事件回调
    // 因为组件 html 都已经挂载到 dom 上了
    // 能保证事件元素一定存在
    protected bindEvents() {
    }

    /*
     mountedElement绑定的事件只会绑定一次
     需要绑定在mountedElement的事件, 一定要通过该方法绑定. 不然多次mount()会重复调用回调
    */
    protected eventDelegate(eventName: keyof HTMLElementEventMap, callback: (event: any) => any) {
        if (this.mountedElement) {
            // 已经绑定过, 直接返回
            if (this.eventDelegateMap.get(eventName)) {
                return
            }
            this.mountedElement.addEventListener(eventName, callback)
            this.eventDelegateMap.set(eventName, callback)
        }
    }

    setParent(parent: View) {
        this.parent = parent
    }

    protected removeFromParent() {
        if (this.parent) {
            // 找到parent中的该组件值, 将其从parent.relationMap中删除
            let s = this.mountedSelector
            let v = this.parent.subViewMountRelationMap.get(s!)
            if (v === undefined) {
                return
            }
            let index = v.findIndex((item) => {
                return item === this
            })
            if (index > -1) {
                v.splice(index, 1)
            }
            this.parent.update()
        } else {
            this.mountedElement.remove()
        }
    }

    // 组件挂载完成 可以取到dom元素
    // 可以在这个函数里塞一些只有挂载完成才能做的操作
    protected viewDidMount() {
    }
}