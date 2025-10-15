import type { _WebSocket } from "./websocket";
import { getLastDevicelnfo } from '../server/api/deviseInfo';

export class DeviceRunData {
    public data = new Map<string, RunData>();
    private listener: any;
    private mapObj = {
        'JGZX.A01': '加工中心.001',
        'JGZX.A02': '加工中心.002',
        'JGZX.A03': '加工中心.003',
        'JGZX.A04': '加工中心.004',
        'JGZX.A05': '加工中心.005',
        'JGZX.A06': '加工中心.006',
        'JGZX.A07': '加工中心.007',
        'JGZX.A08': '加工中心.008',
        'ZGZX.A01': '钻攻中心.009',
    } as any;

    constructor(ws: _WebSocket) {
        ws.onWebSocket(this.onMessage.bind(this) as any);
    }

    onMessage(msg: RunData) {
        console.log("on websocket Message", msg);
        if (msg.deviceId) {
            let modelName = this.mapObj[msg.deviceId];
            console.log(modelName);
            if (modelName) {
                const oldData = this.data.get(modelName);
                //msg.listener = oldData.listener;

                this.data.set(modelName, msg);
                console.log("", this.data);
                this.listener(modelName);
                /*
                for (const callback of data.listener.values()) {
                    try {
                        callback(data);
                    } catch (err) {
                        console.error(err);
                    }
                }
                */

                return;
            }
        }

        //data.listener = new Map();
        //this.data.set(data.deviceName, data);
    }
    setListener(listener: any) {
        this.listener = listener;
    }
    async getLastDevicelnfo() {
        const res = await getLastDevicelnfo({});
        if (res.rows) {
            for (let i = 0; i < res.rows.length; i++) {
                const item = res.rows[i];
                let modelName = this.mapObj[item.deviceId];
                if (modelName) {
                    window.App.sifangBc.postMessage({
                        data: JSON.stringify(item),
                        type: "message"
                    })
                    const oldData = this.data.get(modelName);
                    this.data.set(modelName, item);
                    console.log("", this.data);
                    this.listener(modelName);
                }
            }
        }
    }
}