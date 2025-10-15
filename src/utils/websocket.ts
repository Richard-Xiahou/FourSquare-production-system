export class _WebSocket {
    private ws: WebSocket;
    private url: string;
    private reconnectLimit: number;
    private reconnectInterval: number;

    IsOpen: boolean = false;
    private listeners = new Map();

    constructor(url: string,options: {reconnectLimit?: number,reconnectInterval?: number}) {
        this.url = url;
        this.reconnectLimit = options.reconnectLimit || 3;
        this.reconnectInterval = options.reconnectInterval || 2000;
    }

    get _ws(){
        return this.ws;
    }

    connect() {
        if(this.IsOpen) return;
        // console.log(this.url);

        this.ws = new WebSocket(this.url);
        this.ws.onopen = () => {
            console.log('WebSocket 连接成功');

            // 定时发送 pong 消息
            let pingData = new Uint8Array([0x0A]);
            this.send(pingData);
            setInterval(() => {
                this.send(pingData);
            }, 5000);

            this.IsOpen = true;
        }
        this.ws.onclose = () => {
            console.log('WebSocket 连接关闭');

            if(this.reconnectLimit > 0){
                this.reconnectLimit--;
                setTimeout(() => {
                    this.connect();
                }, this.reconnectInterval);
            }

            this.IsOpen = false;
        }
        this.ws.onmessage = (e) => {
            this.onMessage(e);
        }
        this.ws.onerror = () => {
            console.log('WebSocket 连接错误');

            if(this.reconnectLimit > 0){
                this.reconnectLimit--;
                setTimeout(() => {
                    this.connect();
                }, this.reconnectInterval);
            }

            this.IsOpen = false;
        }
        /*
        setInterval(()=>{
            window.App.sifangBc.postMessage({
                data: "郭浩宇，收到请回答",
                type: "message"
            })
        },10000)
        */
    }

    onMessage(e: any) {
        if (e.data === 'ping' || e.data === 'heartbeat' || e.data === 'pong') {
            return;
        }
        try {
            const data = JSON.parse(e.data);
            // console.log("收到websocket数据:", data);
            window.App.sifangBc.postMessage({
                data: e.data,
                type: "message"
            })
            for (const callback of this.listeners.keys()) {
                try {
                    callback(data);
                } catch (err) {
                    console.error(err);
                }
            }
        } catch (error) {
            console.log('WebSocket 数据解析错误', error);
        }
    }

    /**
     * 添加 WebSocket 消息监听
     * @param callback
     */
    onWebSocket(callback: (data: object) => any) {
        if (!this.listeners.has(callback)) {
            if (typeof callback === 'function') {
                this.listeners.set(callback, null);
            } else {
                console.debug('[WebSocket] 添加 WebSocket 消息监听失败：传入的参数不是一个方法');
            }
        }
    }

    /**
     * 解除 WebSocket 消息监听
     * @param callback
     */
    offWebSocket(callback: (data: object) => any) {
        this.listeners.delete(callback);
    }

    send(data: any) {
        this.IsOpen && this.ws.send(data);
    }

    close() {
        this.ws.close();
    }
}