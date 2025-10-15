import * as GUI from '@babylonjs/gui';
import { AbstractMesh, MeshBuilder, Mesh, TransformNode, Vector3, Animation } from '@babylonjs/core';
import ViewPort from "./viewport";
import { minuteToDate, secondToDate } from "../utils/utils";

export class Dialog {
    viewport: ViewPort;
    private advancedTexture?: GUI.AdvancedDynamicTexture;
    dialogMap: Map<string, AbstractMesh> = new Map<string, AbstractMesh>();
    textBlockObj = {} as any;
    advancedTextureObj = {} as any;
    currentBlock?: GUI.TextBlock;

    constructor(viewport: any) {
        // this.advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
        this.viewport = viewport;
    }

    init() {

    }

    toggle(name: string) {
        // 遍历所有的弹窗，隐藏除了当前的弹窗
        this.dialogMap.forEach((value, key) => {
            if (key === name) {
                value.isVisible = true;
                //console.log(this.textBlockObj[name])
                // 非漫游模式下，相机飞行并聚焦到该弹窗
                this.updataInfo(name);
                if (this.viewport.player.locked) {
                    this.animateCamera(value.parent)
                }
                // 通知图表更新
            } else {
                value.isVisible = false;
            }
        })
    }
    sendMessageToChart(name: string) {
        let deviceRunData = this.viewport._deviceRunData.data.get(name);
        let jsonObj = JSON.stringify(deviceRunData);
        //console.log("-----sendMessageToChart----");
        //console.log(this.viewport._deviceRunData);
        //console.log(jsonObj, name);
        window.App.sifangBc.postMessage({
            data: jsonObj || "无数据",
            type: "deviceSeleted"
        })
    }
    createDialog(mesh: AbstractMesh, parentNode: TransformNode) {
        if (parentNode.metadata.hasDialog || !parentNode) {
            this.toggle(parentNode.name);
            return;
        }

        // 只能存在一个弹窗，隐藏其他弹窗
        this.toggle("");

        let name = parentNode.name;

        // 计算TransformNode的包围盒中心点 作为对话框的位置
        const center = MeshBuilder.CreateBox("center", { size: 0.1 }, this.viewport.scene);
        center.parent = parentNode;
        center.position = Vector3.Zero();
        center.computeWorldMatrix(true);
        const boundingInfo = center.getBoundingInfo();
        const centerWorld = boundingInfo.boundingBox.centerWorld;
        centerWorld.y = 1.25;
        center.dispose();

        const plane = MeshBuilder.CreatePlane("plane", { width: 228 * 0.6, height: 177 * 0.6 }, this.viewport.scene);
        plane.name = "dialog-plane";
        plane.parent = mesh;
        // 设置在包围盒中心点的上方
        const vy = new Vector3(0, 200, 0);
        if (parentNode.name.indexOf("钻攻中心") >= 0) { vy.y = 260; }
        plane.position = centerWorld.add(vy);
        // 解决图片镜像显示的问题
        plane.scaling.x = -1;

        plane.billboardMode = Mesh.BILLBOARDMODE_ALL;

        const advancedTexture = GUI.AdvancedDynamicTexture.CreateForMesh(plane);
        advancedTexture.renderScale = 1;

        // this.createCanvasImg(parentNode.name).then((imgData:string) => {
        //     const image = new GUI.Image("dialog", imgData);
        const image = new GUI.Image("dialog", import.meta.env.VITE_GLOB_PUBLIC_PATH + "images/dialogx2-无合格率.png");
        image.width = 1;
        image.height = 1;
        // image.widthInPixels = 400;
        // image.heightInPixels = 400;
        // image.autoScale = true;
        image.stretch = GUI.Image.STRETCH_NONE; // 拉伸缩放模式. STRETCH_NONE:不拉伸，保持原始大小
        advancedTexture.addControl(image);
        // });

        const imageArrow = new GUI.Image("arrow", import.meta.env.VITE_GLOB_PUBLIC_PATH + "images/dialog-arrowx2.png");
        imageArrow.width = 0.1;
        imageArrow.height = 0.1;
        imageArrow.zIndex = 10;
        imageArrow.left = 430;
        imageArrow.top = -430;
        imageArrow.hoverCursor = "pointer";
        //imageArrow.detectPointerOnOpaqueOnly = true; // 只有在不透明的区域才能检测到指针
        imageArrow.onPointerUpObservable.add(() => {
            if (imageArrow.rotation === 0) {
                this.viewport.enterMesh(parentNode);
                imageArrow.rotation = Math.PI;

                window.App.sifangBc.postMessage({
                    code: parentNode.metadata.code,
                    type: "dialog"
                })
            } else {
                this.viewport.outerMesh();
                imageArrow.rotation = 0;

                window.App.sifangBc.postMessage({
                    code: parentNode.metadata.code,
                    type: "back"
                })
            }
        });
        advancedTexture.addControl(imageArrow);

        const textBlock = new GUI.TextBlock("runTime_" + parentNode.name, "");
        textBlock.color = "#8CEFFF";
        textBlock.zIndex = 1;
        textBlock.fontSize = 58;
        textBlock.fontWeight = "500";
        textBlock.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        textBlock.textVerticalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        textBlock.left = "332px";
        textBlock.top = "70px";
        textBlock.lineSpacing = "-2px";
        textBlock.scaleX = 0.81;
        textBlock.scaleY = 1.01;
        advancedTexture.addControl(textBlock);
        // this.setRunTime(textBlock,[name,"正常","",`${Math.ceil(Math.random() * 100)}件`]);
        this.setRunTime(textBlock, name);

        parentNode.metadata.hasDialog = true;

        this.dialogMap.set(name, plane);

        let key = name;
        this.textBlockObj[key] = textBlock;
        this.advancedTextureObj[key] = advancedTexture;

        // 非漫游模式下，相机飞行并聚焦到该弹窗
        if (this.viewport.player.locked) {
            // this.animateCamera(mesh)
        }
    }

    /**
     * 相机飞行动画
     */
    animateCamera(newTarget: any) {
        const camera = this.viewport.camera;

        const alpha = camera.alpha;
        const beta = camera.beta;
        const radius = camera.radius;
        const target = camera.getTarget().clone();

        camera.focusOn([newTarget], true);
        camera.rebuildAnglesAndRadius();

        var animCamAlpha = new Animation("animCam", "alpha", 30,
            Animation.ANIMATIONTYPE_FLOAT,
            Animation.ANIMATIONLOOPMODE_CYCLE);

        var keysAlpha = [];
        keysAlpha.push({
            frame: 0,
            value: alpha
        });
        keysAlpha.push({
            frame: 100,
            value: camera.alpha
        });
        var animCamBeta = new Animation("animCam", "beta", 30,
            Animation.ANIMATIONTYPE_FLOAT,
            Animation.ANIMATIONLOOPMODE_CYCLE);

        var keysBeta = [];
        keysBeta.push({
            frame: 0,
            value: beta
        });
        keysBeta.push({
            frame: 100,
            value: camera.beta
        });
        var animCamRadius = new Animation("animCam", "radius", 30,
            Animation.ANIMATIONTYPE_FLOAT,
            Animation.ANIMATIONLOOPMODE_CYCLE);

        var keysRadius = [];
        keysRadius.push({
            frame: 0,
            value: radius
        });
        keysRadius.push({
            frame: 100,
            value: 7
        });

        var animCamTarget = new Animation("animTarget", "_target", 30,
            Animation.ANIMATIONTYPE_VECTOR3,
            Animation.ANIMATIONLOOPMODE_CYCLE);

        var keysTarget = [];
        keysTarget.push({
            frame: 0,
            value: target
        });
        keysTarget.push({
            frame: 100,
            value: camera.target.clone()
        });
        animCamAlpha.setKeys(keysAlpha);
        animCamBeta.setKeys(keysBeta);
        animCamRadius.setKeys(keysRadius);
        animCamTarget.setKeys(keysTarget);

        camera.animations.push(animCamAlpha);
        camera.animations.push(animCamBeta);
        camera.animations.push(animCamRadius);
        camera.animations.push(animCamTarget);

        camera.alpha = alpha;
        camera.beta = beta;
        camera.radius = radius;
        camera.target.copyFrom(target);

        this.viewport.scene.beginAnimation(camera, 0, 100, false, 5, function () { });
    }

    /**
     * 通过接口获取数据，然后创建canvas，将图片和数据绘制到canvas上
     */
    createCanvasImg(name: string) {
        return new Promise((resolve, reject) => {
            // 加载图片作为背景
            const canvas = document.createElement("canvas");
            canvas.width = 456;
            canvas.height = 354;

            const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

            const img = new Image();
            img.src = "/images/dialogx2.png";
            img.onload = function () {
                ctx.drawImage(img, 0, 0, 456, 354);

                // 绘制文字
                ctx.fillStyle = "#8CEFFF";
                ctx.font = "500 20px Arial";

                // 设备名称
                //ctx.fillText(name, 192, 94);
                // 运行状态
                //ctx.fillText("正常", 192, 150);
                // 运行时间
                // ctx.fillText("31小时11分34秒", 192, 207);
                // 加工工件
                //ctx.fillText("111件", 192, 263);
                // 本日合格率
                //ctx.fillText("99.9%", 192, 322);

                // 绘制完毕
                const imgData = canvas.toDataURL("image/png");

                resolve(imgData);
            }

            img.onerror = function () {
                reject("图片加载失败");
            }
        })
    }

    /**
     * demo 运行时间字符串设置
     * @param textBlock
     * @param {string} name 设备名称
     */
    setRunTime(textBlock: GUI.TextBlock, name: string) {
        if (this.currentBlock) {
            this.currentBlock.isVisible = false;
        }
        textBlock.isVisible = true;
        this.currentBlock = textBlock;

        this.sendMessageToChart(name);
        let data = this.viewport._deviceRunData.data.get(name);
        // console.log(this.viewport._deviceRunData, name);
        if (!data) {
            textBlock.text = `${name}\n\n\n停机\n\n\n${this.getRunTime(0)}\n\n\n未知`;
            return;
        }

        let timestamp = data.runningTime * 60;


        //textBlock.text = `${name}\n\n\n${data.deviceState === "UNKNOWN" ? '停机' : '正常'}\n\n\n${this.getRunTime(timestamp)}\n\n\n${data.pieceNumber}`;
        textBlock.text = `${name}\n\n\n${data.deviceState === "UNKNOWN" ? '停机' : '正常'}\n\n\n${this.getRunTime(data.runningTime)}\n\n\n${data.pieceNumber}`;

        // let sit = 0;
        // sit = setInterval(() => {
        //     if(!textBlock) {
        //         clearInterval(sit);
        //         data.listener.delete("setRunTime");
        //         return;
        //     }
        //
        //     timestamp++;
        //     textBlock.text = `${name}\n\n\n${data.deviceState === "UNKNOWN" ? '停机' : '正常'}\n\n\n${getRunTime(timestamp)}\n\n\n${data.pieceNumber}`;
        // },1000)

        (data.listener as Map<string, Function>).set("setRunTime", () => {
            // this.setRunTime(textBlock, name);
            this.updataInfo(name);
        });
    }
    getRunTime(second: number) {
        const currentTime = minuteToDate(second);
        return `${currentTime[0]}年${currentTime[1]}天${currentTime[2]}小时${currentTime[3]}分` // ${currentTime[4]}秒`
    }
    /** 点击时候更新数据 */
    updataInfo(name: string) {
        this.sendMessageToChart(name);
        let data = this.viewport._deviceRunData.data.get(name);
        let textBlock = this.textBlockObj[name];

        if (this.currentBlock) {
            this.currentBlock.isVisible = false;
        }
        textBlock.isVisible = true;
        this.currentBlock = textBlock;

        if (!data) {
            textBlock.text = `${name}\n\n\n停机\n\n\n${this.getRunTime(0)}\n\n\n未知`;
            return;
        }
        if (data && textBlock) {
            textBlock.text = `${name}\n\n\n${data.deviceState}\n\n\n${this.getRunTime(data.runningTime)}\n\n\n${data.pieceNumber}`;

        }
        console.log(textBlock);
    }
}