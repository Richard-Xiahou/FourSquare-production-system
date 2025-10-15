declare interface RunData {
    cycleTime?: number; //循环时间 分钟
    deviceId: string; //设备ID
    deviceName: string; //设备名称
    deviceIp?: string; //设备ip
    deviceState:"STaRT" | "****(reset)" | "UNKNOWN"; //设备状态
    pieceNumber: number; //产品数量
    readTime?: string; // 读取时间
    runningTime: number; //运行时间 分钟
    toolNumber?: number; //刀具号
    warningInfo?: string; //警告信息
    listener?: Map<string,Function>;
}