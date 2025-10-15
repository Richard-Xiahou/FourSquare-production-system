import {
    Scene,
    Engine,
    WebGPUEngine,
    Mesh,
    Animation,
    TransformNode,
    AnimationGroup,
    Constants,
    type IInspectorOptions
} from "@babylonjs/core";

export default class App {
    canvas: HTMLCanvasElement;
    // 通信
    sifangBc:BroadcastChannel;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;

        this.sifangBc = new BroadcastChannel("sifangBc");
    }

    // 尝试创建一个 WebGPU 引擎，然后是 WebGL 引擎，然后是空引擎
    async createEngineFactory(): Promise<Engine | WebGPUEngine> {
        const webGPUSupported = await WebGPUEngine.IsSupportedAsync;
        if (webGPUSupported && false) {
            const engine = new WebGPUEngine(this.canvas);
            await engine.initAsync();

            return engine;
        }
        return new Engine(this.canvas, true);
    }

    // 创建场景
    createScene(engine: Engine | WebGPUEngine): Scene {
        const scene = new Scene(engine);
        scene.useRightHandedSystem = true;
        return scene;
    }

    async runDebugger(scene: Scene,config?: IInspectorOptions) {
        const _config = Object.assign({
            overlay:true
        },config)
        await import("@babylonjs/inspector");
        await scene.debugLayer.show(_config);
    };

    /**
     * 启用WebGPU快照渲染
     * @param mode
     */
    setSnapshotMode = (engine,mode) => {
        switch(mode) {
            case "disabled":
                engine.snapshotRendering = false;
                break;
            case "standard": // 标准模式
                engine.snapshotRenderingMode = Constants.SNAPSHOTRENDERING_STANDARD;
                engine.snapshotRendering = true;
                break;
            case "fast": //快速模式
                engine.snapshotRenderingMode = Constants.SNAPSHOTRENDERING_FAST;
                engine.snapshotRendering = true;
                break;
        }
    };

    // 为Mesh添加向上的动画
    public addAnimationUpward(mesh: Mesh, scene: Scene):void {
        /* 方式一： 简易方式设置动画。30FPS，总的30帧，故一次动画执行一秒 */
        // const animatable = Animation.CreateAndStartAnimation("meshUpward",mesh,"position.z",30,30,mesh.position.z,mesh.position.z + 1000,0)

        /* 方式二：帧控制 */
        const myAnima = new Animation("meshUpward", "position.z", 30, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
        const keys = [];
        keys.push({
            frame: 0, //当前关键帧
            value: mesh.position.z //当前关键帧时属性的值
        })
        keys.push({
            frame: 30,
            value: mesh.position.z + 700
        })
        keys.push({
            frame: 60,
            value: mesh.position.z + 1000
        })
        myAnima.setKeys(keys);

        mesh.animations.push(myAnima);
        // 开始播放动画，参数：目标mesh,起始帧，结束帧，是否循环
        const animatable = scene.beginAnimation(mesh, 0, 60, false);
    }

    // 为 TransformNode 添加向上的动画
    public addAnimationUpwardForTransformNode(tNode: TransformNode, scene: Scene):void {
        // 创建动画组
        const animateGroup = new AnimationGroup(`${tNode.id}-${tNode.name}`);

        // 创建动画
        const myAnima = new Animation("meshUpward", "position.z", 30, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
        const children:Mesh[] = tNode.getChildren();
        const tNodePosition = children[0].position;
        const keys = [];
        keys.push({
            frame: 0, //当前关键帧
            value: tNodePosition.z //当前关键帧时属性的值
        })
        keys.push({
            frame: 30,
            value: tNodePosition.z + 700
        })
        keys.push({
            frame: 60,
            value: tNodePosition.z + 1000
        })
        myAnima.setKeys(keys);

        for(let mesh of children){
            animateGroup.addTargetedAnimation(myAnima,mesh);
        }

        // 统一设置起始和结束帧
        animateGroup.normalize(0,60);

        // 设置速率
        animateGroup.speedRatio = 2;

        animateGroup.start();
    }

    dispose(): void {
        this.canvas = null;
    }
}