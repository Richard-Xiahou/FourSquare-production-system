import HavokPhysics from "@babylonjs/havok";
import {
    ActionManager,
    ArcRotateCamera,
    DirectionalLight,
    Engine,
    ExecuteCodeAction,
    HavokPlugin,
    HemisphericLight,
    Mesh,
    MeshBuilder,
    TransformNode,
    Scene,
    SceneLoader,
    ShadowGenerator,
    Vector3,
    WebGPUEngine,
    PhysicsShapeConvexHull,
    PhysicsBody,
    PhysicsMotionType, PhysicsShapeMesh, Viewport,
} from "@babylonjs/core";
import { SkyMaterial } from "@babylonjs/materials";
import { HighlightLayer } from "@babylonjs/core/Layers";
import "@babylonjs/loaders/glTF";
//import { Dialog } from "./Dialog";
import { Player } from "./Player";
import {DeviceRunData} from "../utils/deviceRunData";
import { FacilityInfo } from "./FacilityInfo";

let resizeObserver: ResizeObserver;

export default class ViewPort {
    canvas: HTMLCanvasElement;
    engine: Engine | WebGPUEngine;
    scene: Scene;
    private readonly directionalLight: DirectionalLight;
    private shadowGenerator?: ShadowGenerator;
    //private hl: HighlightLayer;
    camera: ArcRotateCamera;
    private readonly roamCamera: ArcRotateCamera;
    //private dialog: Dialog;

    player?: Player;
    private facilityInfo:FacilityInfo;

    // WebGPU 快照渲染模式
    private snapshotMode: "disabled" | "standard" | "fast" = "fast";

    // canvas pointer事件按下位置
    private pointerDownPosition: { x: number, y: number } = { x: 0, y: 0 };

    // 四方主模型
    modelNode: any;
    hideModel: Mesh[] = [];
    _deviceRunData: DeviceRunData;

    constructor(engine: Engine | WebGPUEngine, canvas: HTMLCanvasElement,deviceRunData:DeviceRunData) {
        this.canvas = canvas;
        
        this._deviceRunData = deviceRunData;

        this.engine = engine;
        this.scene = window.App.createScene(engine);
        this.camera = this.createArcRotateCamera(this.scene);
        this.roamCamera = this.createRoamCamera();

        //window.App.runDebugger(this.scene);

        this.directionalLight = this.createLight();
        //this.shadowGenerator = this.createShadowGenerator();
        //this.hl = this.createHighLightLayer();

        //this.dialog = new Dialog(this);

        this.facilityInfo = FacilityInfo.getInstance();
        this.facilityInfo.initAnimation(this);
        this.facilityInfo.setDeviceRunData(this._deviceRunData);
        this._deviceRunData.setListener(this.facilityInfo.updataInfo); // websocket 有数据的时候，更新数据

        this.enablePhysics().then(() => {
            this.init();

            this.scene.executeWhenReady(() => {
                // TODO 造成GUI无法显示
                // window.App.setSnapshotMode(engine,this.snapshotMode);
            });
        })

        let keydownNum = 0;
        window.addEventListener("keydown", (evt) => {
            // 按下v键，切换视角
            if (evt.key === "v") {
                keydownNum++;
                (this.player as any).locked = !(this.player as any).locked;

                if ((this.player as any).locked) {
                    this.roamCamera.detachControl();
                    this.camera.attachControl(this.canvas, true);
                    this.scene.activeCamera = this.camera;
                } else {
                    this.camera.detachControl();
                    this.roamCamera.attachControl(this.canvas, true);
                    this.scene.activeCamera = this.roamCamera;

                    // 第一次切换，看向正前方
                    if (keydownNum === 1) {
                        setTimeout(() => {
                            this.roamCamera.alpha = 0;
                            this.roamCamera.beta = 0.5 * Math.PI;
                        }, 150)
                    }
                }
            }
        })

        // 监听canvas点击，隐藏弹窗
        this.canvas.addEventListener("pointerdown", this.canvasPointerDown.bind(this));
        this.canvas.addEventListener("pointerup", this.canvasPointerUp.bind(this));

        window.App.sifangBc.onmessage = (e) => {
            switch(e.data.type) {
                case "goHome":
                    this.outerMesh();
                    //this.dialog.toggle("");
                    break;
            }
        }
    }

    /**
     * 创建弧旋转相机(行星相对于太阳的轨道)
     */
    createArcRotateCamera(scene:any) {
        const camera = new ArcRotateCamera('ArcRotateCamera', 0.8189, 0.9792, 18.5373, new Vector3(1.57, 0.28, -3.64), scene);
        camera.attachControl(this.canvas, true);
        // 摄像机到目标的最小允许距离（摄像机不能靠近）
        camera.lowerRadiusLimit = 1;
        // 相机到目标的最大允许距离（相机不能走得更远）
        camera.upperRadiusLimit = 200;
        // 设置指针平移灵敏度或相机平移的速度（右键移动场景的速度，值越大越慢,默认1000）
        camera.panningSensibility = 900;
        // 设置鼠标滚轮精度或相机变焦速度（滚轮滚动速度，越小越快，默认3）。
        camera.wheelPrecision = 10;
        // 设置指针捏合精度或相机变焦速度（触控，默认12）。
        camera.pinchPrecision = 10;
        // 使用鼠标当前位置作为缩放中心
        camera.zoomToMouseLocation = true;
        // near plane
        camera.minZ = 0.2;
        // far plane
        camera.maxZ = 5500;
        // 开启自动旋转
        // camera.useAutoRotationBehavior = true;

        return camera;
    }

    /**
     * 创建漫游相机
     */
    createRoamCamera() {
        const camera = new ArcRotateCamera('roamCamera', 0, 0.5 * Math.PI, 0.2, new Vector3(0, 0.3, 0), this.scene);
        camera.setPosition(new Vector3(20, 3, 0));
        camera.fov = 0.3 * Math.PI;
        camera.minZ = 0.1;
        camera.maxZ = 5500;
        camera.wheelPrecision = 30;  // 鼠标缩放速度放慢20倍
        camera.keysLeft = [] // key code
        camera.keysRight = []
        camera.keysUp = []
        camera.keysDown = []
        // 半径
        camera.lowerRadiusLimit = 0;
        camera.upperRadiusLimit = 0;
        // camera俯仰角度限制,设置beta的范围限制 顶部是0PI,水平是0.5PI
        camera.lowerBetaLimit = 0;  // 顶部
        camera.upperBetaLimit = Math.PI * 0.55; // 水平
        // 水平旋转camera的速度
        camera.angularSensibilityX = 2000;

        camera.attachControl(this.canvas, true);
        return camera;
    }

    /**
     * 创建光源
     */
    createLight() {
        const light = new HemisphericLight("light", new Vector3(0, 1, 0), this.scene);
        light.intensity = 0.7;

        const directionalLight = new DirectionalLight("directionalLight", new Vector3(-1, -2, -1), this.scene);
        directionalLight.position = new Vector3(0, 100, 100);
        directionalLight.intensity = 3;

        return directionalLight;
    }

    /**
     * 创建阴影
     */
    createShadowGenerator() {
        const shadowGenerator = new ShadowGenerator(1024, this.directionalLight);
        // 减少阴影的锯齿
        shadowGenerator.useExponentialShadowMap = true;
        // 柔化阴影。结果更好，但速度更慢
        shadowGenerator.usePoissonSampling = true;
        //PCF(仅WebGL 2.0)
        shadowGenerator.usePercentageCloserFiltering = true;

        return shadowGenerator;
    }

    /**
     * 创建高亮层
     */
    createHighLightLayer() {
        return new HighlightLayer("hl", this.scene);
    }

    async init() {
        this.animate();

        this.createSkyBox(this.scene);

        this.addModel();

        this.resize();

        resizeObserver = new ResizeObserver(this.resize.bind(this));
        resizeObserver.observe(this.canvas);
    }

    /**
     * 创建天空盒
     */
    createSkyBox(scene:Scene) {
        const skybox = MeshBuilder.CreateBox("SkyBox", { size: 5000, updatable: false },scene);
        skybox.material = new SkyMaterial("sky", scene);
        (skybox.material as SkyMaterial).inclination = -0.1; //表示太阳的倾斜，即日照强度，区间为[-0.5,0.5],
        (skybox.material as SkyMaterial).azimuth = 0.25; //表示太阳的方位，区间为[0,1]
        (skybox.material as SkyMaterial).luminance = 1; //表示太阳的亮度，区间为[0,1]
        // (skybox.material as SkyMaterial).turbidity = 1; //定义雾霾的量(散射),区间为[0,20]
        // (skybox.material as SkyMaterial).rayleigh = 0; //表示天空外观(全局)
        skybox.material.backFaceCulling = false; //剔除，不设置false看不到天空
    }

    addModel() {
        SceneLoader.ImportMeshAsync("", import.meta.env.VITE_GLOB_PUBLIC_PATH + "model/", "浙江四方箱体机加工线整体模型-20240311.glb",this.scene).then(model => {
            model.meshes.forEach(mesh => {
                //mesh.actionManager = new ActionManager(this.scene);
                // 点击时执行函数
                // mesh.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnLeftPickTrigger,() => this.app.addAnimationUpward(mesh as Mesh,_scene)))
                //  mesh.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnPointerOverTrigger,()=>{
                //      this.hl.addMesh(mesh as Mesh,new Color3(0,1,0));
                //  }))
                //  mesh.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnPointerOutTrigger,()=>{
                //      this.hl.removeMesh(mesh as Mesh);
                //  }))

                // 为mesh添加阴影
                if (mesh.constructor === Mesh) {
                    // this.shadowGenerator.addShadowCaster(mesh);
                }

                // 接收阴影
                //mesh.receiveShadows = true;
                // 设置碰撞
                mesh.checkCollisions = true;
            })

            const addAction = (transformNode:any,parent?:any) => {
                // @ts-ignore
                transformNode._children.forEach((mesh) => {
                    if (mesh instanceof Mesh) {
                        mesh.actionManager = new ActionManager(this.scene);
                        mesh.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnPickTrigger, (evt) => {
                            if (evt.sourceEvent.button !== 0 || mesh.visibility === 0) return;
                            //this.dialog.createDialog(mesh, parent || transformNode);
                            this.facilityInfo.setData(mesh);
                            // 点击设备，发送消息
                            window.App.sifangBc.postMessage({
                                code: transformNode.metadata.code,
                                type: "device"
                            })
                        }));
                        // 鼠标经过事件
                        // mesh.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnPointerOverTrigger, (e) => {
                        //     if (mesh.visibility === 0) {
                        //         setTimeout(()=>{
                        //             e.sourceEvent.target.style.cursor = "default";
                        //         },100)
                        //     }
                        // }))

                        mesh.metadata.source = (parent || transformNode).name;
                    }else if(mesh instanceof TransformNode){
                        addAction(mesh,parent || transformNode);
                    }
                });
            }

            console.log(model)

            model.transformNodes.forEach((transformNode) => {
                // 正则表达式校验名称是否满足 `加工中心.\d\d\d`
                const reg = /^加工中心\.\d{3}$/;
                if (reg.test(transformNode.name)) {
                    transformNode.metadata.code = `JGZX.A${transformNode.name.substring(6)}`;
                    addAction(transformNode);
                }else if(transformNode.name === "钻攻中心.009"){
                    transformNode.metadata.code = `ZGZX.A09`;
                    addAction(transformNode);
                }
            })

            this.scene.rootNodes.forEach((node) => {
                if (node instanceof Mesh && node.name === "__root__") {
                    node.name = "四方";
                    node.position = new Vector3(2.422, -0.01, -2.137);
                    this.modelNode = node;
                }
            })

            SceneLoader.ImportMeshAsync("", import.meta.env.VITE_GLOB_PUBLIC_PATH + "model/", "四方合并白膜.glb",this.scene).then(model => {
                model.meshes.forEach(mesh => {
                    // 创建mesh物理引擎刚体。大小将自动确定。
                    if (!(mesh instanceof Mesh)) return;
                    let shape = new PhysicsShapeMesh(mesh, this.scene);
                    const physicsBody = new PhysicsBody(mesh, PhysicsMotionType.STATIC, false, this.scene);
                    physicsBody.shape = shape;
                    physicsBody.setMassProperties({
                        mass: 1,
                    });

                    mesh.visibility = 0;

                    // 不接受pick
                    mesh.isPickable = false;
                })
            })

            //添加玩家
            this.player = new Player(this.scene, this.roamCamera);
            this.player.locked = true;
        })
    }

    /**
     * 添加物理引擎
     */
    async enablePhysics() {
        const havokInstance = await HavokPhysics();
        const hk = new HavokPlugin(true, havokInstance);
        this.scene.enablePhysics(new Vector3(0, -9.81, 0), hk);
    }

    canvasPointerDown(evt: PointerEvent) {
        this.pointerDownPosition = { x: evt.clientX, y: evt.clientY };
    }

    canvasPointerUp(evt: PointerEvent) {
        const { x, y } = this.pointerDownPosition;
        const dx = evt.clientX - x;
        const dy = evt.clientY - y;

        // 鼠标移动距离小于10，认为是点击事件
        if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
            const object = this.scene.pick(x, y).pickedMesh as Mesh;
            if (object.name === "dialog-plane" || /^加工中心\.\d{3}$/.test((object as any).parent?.name)) return;
            if(object.metadata?.source === "钻攻中心.009") return;

            //this.dialog.toggle("");
            this.facilityInfo.hide();

            window.App.sifangBc.postMessage({
                code:"",
                type:"goHome"
            })
        }
    }

    outerMesh() {
        this.hideModel.forEach(mesh => {
            mesh.visibility = 1;
        })
        this.hideModel = [];
    }

    enterMesh(transformNode: TransformNode) {
        // 隐藏其他模型节点
        this.modelNode._children.forEach((node:any) => {
            if (node.id !== transformNode.id) {
                if (node instanceof Mesh) {
                    node.visibility = 0;
                    this.hideModel.push(node);
                } else if (node instanceof TransformNode) {
                    this.traverseHideModel(node)
                } else {
                    node.visibility = 0;
                    this.hideModel.push(node);
                }
            }
        })
    }

    // 递归隐藏模型
    traverseHideModel(node: TransformNode) {
        // @ts-ignore
        if (node._children) {
            // @ts-ignore
            node._children.forEach(child => {
                if (child instanceof Mesh) {
                    child.visibility = 0;
                    this.hideModel.push(child);
                } else if (child instanceof TransformNode) {
                    this.traverseHideModel(child)
                }
            })
        }
    }

    resize() {
        this.engine.resize();

        // 重置快照渲染
        // if(this.engine.snapshotRendering && this.snapshotMode !== "disabled"){
        //     this.engine.snapshotRendering = false;
        //     // 需要推迟启用快照渲染
        //     setTimeout(() => {
        //         window.App.setSnapshotMode(this.engine,this.snapshotMode);
        //     }, 4);
        // }
    }

    animate() {
        this.engine.runRenderLoop(() => {
            this.render();
        });
    }

    render() {
        this.scene.render();
    }

    dispose() {
        this.scene.dispose();
        this.engine.dispose();

        resizeObserver.unobserve(this.canvas);
    }
}