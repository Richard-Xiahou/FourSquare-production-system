import { AbstractMesh, MeshBuilder, Mesh, TransformNode, Vector3, Animation } from '@babylonjs/core';
import ViewPort from "./viewport";

export class AnimateToMesh {
    private static _instance: AnimateToMesh;
    private viewport?: ViewPort;
    constructor() {
        this.init();
    }
    public static getInstance() {
        if (!this._instance) this._instance = new AnimateToMesh();
        return this._instance;
    }
    private init() { }
    public setViewPort(viewport: ViewPort) {
        this.viewport = viewport;
    }
    public enterMesh(mesh:Mesh){
        this.viewport?.enterMesh(mesh);
    }
    public outerMesh(){
        this.viewport?.outerMesh();
    }
    /**
     * 相机飞行动画
     */
    animateCamera(newTarget: any) {
        if ((this.viewport as ViewPort).player.locked == false) {
            // 漫游模式下，相机不萌飞行并聚焦到该弹窗
            return;
        }

        const camera = (this.viewport as ViewPort).camera;
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

        (this.viewport as ViewPort).scene.beginAnimation(camera, 0, 100, false, 5, function () { });
    }
}