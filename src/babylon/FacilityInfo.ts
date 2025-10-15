import { Mesh, MeshBuilder, TransformNode, Vector3 } from '@babylonjs/core';
import { Ellipse, AdvancedDynamicTexture, Control, Rectangle, Image, TextBlock, StackPanel } from '@babylonjs/gui';
import { AnimateToMesh } from "./AnimateToMesh";
import { minuteToDate, secondToDate, positiveNumber,minuteToHM } from "../utils/utils";


export class FacilityInfo {
    private static _instance: FacilityInfo;
    private gui: AdvancedDynamicTexture;
    private mc?: Rectangle;
    private imageArrow?: Image;
    private textBlock?: TextBlock;
    private isShow = true;
    private box?: Mesh;
    private animation: AnimateToMesh;
    private deviceRunData: any;
    private equipmentMesh?: Mesh;
    private positionObj = {
        '加工中心.001': { code: "JGZX.A01", vec: new Vector3(3.5, 2.2, -5) }, //1
        '加工中心.002': { code: "JGZX.A02", vec: new Vector3(0.5, 2.2, -5) }, //2
        '加工中心.003': { code: "JGZX.A03", vec: new Vector3(-4.8, 2.2, -5) }, //3
        '加工中心.004': { code: "JGZX.A04", vec: new Vector3(-7.8, 2.2, -5) }, //4
        '加工中心.005': { code: "JGZX.A05", vec: new Vector3(3.5, 2.2, -1) }, //5
        '加工中心.006': { code: "JGZX.A06", vec: new Vector3(0.5, 2.2, -1) }, //6
        '加工中心.007': { code: "JGZX.A07", vec: new Vector3(-4.8, 2.2, -1) }, //7
        '加工中心.008': { code: "JGZX.A08", vec: new Vector3(-7.8, 2.2, -1) }, //8
        '钻攻中心.009': { code: "ZGZX.A01", vec: new Vector3(-2, 2.2, -5) }, //9
    } as any;
    private code = "";

    constructor() {
        this.gui = AdvancedDynamicTexture.CreateFullscreenUI("UI");
        this.gui.idealWidth = 1000;
        this.animation = AnimateToMesh.getInstance();
        this.initUI();
    }
    public static getInstance() {
        if (!this._instance) this._instance = new FacilityInfo();
        return this._instance;
    }
    private initUI() {
        this.mc = new Rectangle();
        // 左下角
        this.mc.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        this.mc.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this.mc.width = "160px";
        this.mc.height = "124px";
        this.mc.top = "10px";
        this.mc.left = "220px";
        this.mc.color = "#ffcc0000";
        this.gui.addControl(this.mc);
        this.mc.isPointerBlocker = true;  // 允许鼠标交互

        let image = new Image("bg2", import.meta.env.VITE_GLOB_PUBLIC_PATH + "images/dialogx2-无合格率.png");
        image.width = "160px";
        image.height = "124px";
        image.top = 0;
        image.left = 0;
        this.mc.addControl(image);


        this.textBlock = new TextBlock("context", "");
        this.textBlock.color = "#8CEFFF";
        this.textBlock.zIndex = 1;
        this.textBlock.fontSize = 8;
        this.textBlock.fontWeight = "500";
        this.textBlock.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        this.textBlock.textVerticalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        this.textBlock.left = 60;
        this.textBlock.top = 15;
        this.textBlock.lineSpacing = -1.8;
        this.mc.addControl(this.textBlock);
        this.textBlock.text = 'ggh\n\n\nuiuii\n\n\n豆腐干地方\n\n\n记号记号记号';


        this.imageArrow = new Image("close_btn", import.meta.env.VITE_GLOB_PUBLIC_PATH + "images/dialog-arrowx2.png");
        this.imageArrow.width = "13px";
        this.imageArrow.height = "13px";
        this.mc.addControl(this.imageArrow);
        this.imageArrow.top = -52;
        this.imageArrow.left = 68;

        this.box = MeshBuilder.CreateBox("box", { height: 0.5, width: 0.5, depth: 0.5 });
        this.box.position.set(0, 2.2, -1.5);
        this.box.visibility = 0;
        this.addToMesh(this.box);

        this.imageArrow.onPointerUpObservable.add(() => {
            if (this.imageArrow) {
                if (this.imageArrow.rotation == 0) {
                    if (this.equipmentMesh) {
                        this.animation.enterMesh(this.equipmentMesh);
                    }
                    this.imageArrow.rotation = Math.PI;
                    window.App.sifangBc.postMessage({
                        code: this.code,
                        type: "dialog"
                    })
                } else {
                    this.animation.outerMesh();
                    this.imageArrow.rotation = 0;
                    window.App.sifangBc.postMessage({
                        code: this.code,
                        type: "back"
                    })
                }
                setTimeout(() => {
                    this.show(); // viewport的canvasPointerUp()方法会隐藏面板
                }, 10);
            }
        });
        this.imageArrow.onPointerEnterObservable.add(() => {
            document.body.style.cursor = 'pointer'; // 光标改成手型
        });
        this.imageArrow.onPointerOutObservable.add(() => {
            document.body.style.cursor = ''; // 光标改成默认箭头
        });
        this.hide();
    }
    public setDeviceRunData(data: any) {
        this.deviceRunData = data;
    }
    private addToMesh(mesh: Mesh) {
        this.show();
        if (this.mc) {
            this.mc.linkWithMesh(mesh);
            // 右边
            //this.mc.linkOffsetX = 120;
            //this.mc.linkOffsetY = 100;
        }
    }
    public initAnimation(viewport: any) {
        this.animation.setViewPort(viewport);
    }
    public setData(mesh: Mesh) {
        let nowObjName = mesh.name.substring(0, 8);
        let obj = this.positionObj[nowObjName];
        this.code = obj.code;
        let vec = this.positionObj[nowObjName].vec;
        this.box?.position.set(vec.x, vec.y, vec.z);
        this.show();
        this.animation.animateCamera(mesh);
        this.updataInfo(nowObjName);
        this.findParent(mesh, nowObjName);
        //console.log(this.equipmentMesh);
    }
    private findParent(mesh: Mesh, name: string) {
        if (mesh.name == name) {
            this.equipmentMesh = mesh;
            return;
        }
        this.findParent(mesh.parent as Mesh, name);
    }

    sendMessageToChart(name: string) {
        let data = this.deviceRunData.data.get(name);
        let jsonObj = JSON.stringify(data);
        window.App.sifangBc.postMessage({
            data: jsonObj || "无数据",
            type: "deviceSeleted"
        })
    }
    getRunTime(second: number) {
        /*
        const currentTime = minuteToDate(second);
        const yearStr = currentTime[0] < 0 ? '' : currentTime[0] + '年';
        return `${yearStr}${currentTime[1]}天${currentTime[2]}小时${currentTime[3]}分` // ${currentTime[4]}秒`
        */
       const currentTime = minuteToHM(second);
       return `${currentTime[0]}小时${currentTime[1]}分`;
    }
    /** 点击时候更新数据 */
    updataInfo(name: string) {
        console.log(name);
        this.sendMessageToChart(name);
        let data = this.deviceRunData.data.get(name);
        if (!data) {
            (this.textBlock as any).text = `${name}\n\n\n停机\n\n\n${this.getRunTime(0)}\n\n\n未知`;
            return;
        }
        if (data) {
            (this.textBlock as any).text = `${name}\n\n\n${data.deviceState}\n\n\n${this.getRunTime(data.runningTime)}\n\n\n${positiveNumber(data.pieceNumber)}`;

        }
    }
    public getVisible() {
        return this.isShow;
    }
    public hide() {
        this.isShow = false;
        (this.mc as Rectangle).isVisible = false;
    }
    public show() {
        this.isShow = true;
        (this.mc as Rectangle).isVisible = true;
    }
}