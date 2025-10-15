/**
 * @description: 秒转时间数组
 * @param second
 */
export function secondToDate(second: number): number[] {
    const time = [0, 0, 0, 0, 0];
    let factor = 1;
    if (!second) {
        return time;
    }
    // 转换为正数
    if (second < 0) {
        //factor = -1;
        second = second * -1; // 转换为正数
    }

    if (second >= 365 * 24 * 3600) {
        time[0] = parseInt(String(second / (365 * 24 * 3600))) * factor;
        second %= 365 * 24 * 3600;
    }
    if (second >= 24 * 3600) {
        time[1] = parseInt(String(second / (24 * 3600)));
        second %= 24 * 3600;
    }
    if (second >= 3600) {
        time[2] = parseInt(String(second / 3600));
        second %= 3600;
    }
    if (second >= 60) {
        time[3] = parseInt(String(second / 60));
        second %= 60;
    }
    if (second > 0) {
        time[4] = second;
    }
    return time;
}

/**
 * @description: 分转时间数组
 * @param minute
 */
export function minuteToDate(minute: number): number[] {
    const time = [0, 0, 0, 0];
    let factor = 1;
    if (!minute) {
        return time;
    }
    // 转换为正数
    if (minute < 0) {
        factor = -1;
        minute = minute * -1; // 转换为正数
    }

    if (minute >= 365 * 24 * 60) {
        time[0] = parseInt(String(minute / (365 * 24 * 60))) * factor;
        minute %= 365 * 24 * 69;
    }
    if (minute >= 24 * 60) {
        time[1] = parseInt(String(minute / (24 * 60)));
        minute %= 24 * 60;
    }
    if (minute >= 60) {
        time[2] = parseInt(String(minute / 60));
        minute %= 60;
    }
    if (minute > 0) {
        time[3] = minute;
    }
    return time;
}

/**
 * @description: 分转小时/分数组
 * @param minute
 */
export function minuteToHM(minute: number): number[] {
    const time = [0, 0];
    let factor = 1;
    if (!minute) {
        return time;
    }
    // 转换为正数
    if (minute < 0) {
        factor = -1;
        minute = minute * -1; // 转换为正数
    }

    if (minute >= 60) {
        time[0] = parseInt(String(minute / 60));
        minute %= 60;
    }
    if (minute > 0) {
        time[1] = minute;
    }
    return time;
}

export function positiveNumber(num: number): number {
    let number = 0;
    let factor = 1;
    if (typeof num === 'number') {
        if (num < 0) {
            factor = -1;
        }
        number = num * factor;
    }
    return number;
}