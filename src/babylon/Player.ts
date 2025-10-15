import {
    AbstractMesh,
    Scene,
    ArcRotateCamera,
    MeshBuilder,
    StandardMaterial,
    Color3,
    Vector3,
    Quaternion,
    PhysicsShapeBox,
    PhysicsMotionType,
    PhysicsBody,
} from '@babylonjs/core';

let physicsBody;
export class Player {
    public player?: AbstractMesh;
    public scene: Scene;
    public camera: ArcRotateCamera;


    private keys = {
        jump: 0,
        fly: 0,
        left: 0,
        right: 0,
        forward: 0,
        back: 0
    }
    private action: number = 0;
    private speedNum: number = 0.02;
    private speed: number = 0;
    public locked: boolean = false;

    constructor(scene: Scene, camera: ArcRotateCamera) {
        this.scene = scene;
        this.camera = camera;

        this.addPlayer();
    }

    private async addPlayer() {
        if (this.player) {
            return;
        }
        const dirBox = MeshBuilder.CreateBox("box", {
            size: 8,
            width: 0.1,
            height: 1,
            depth: 0.1
        }, this.scene);
        const mat2 = new StandardMaterial("mat2", this.scene);
        mat2.diffuseColor = new Color3(0, 0.3, 0.8);
        // mat2.alpha = 0.3;
        dirBox.material = mat2;
        dirBox.name = "dirBox";
        dirBox.isPickable = false;
        const targetBox = MeshBuilder.CreateBox("targetBox", {
            size: 1,
            width: 0.1,
            height: 0.1,
            depth: 0.1
        }, this.scene);
        targetBox.material = mat2;
        targetBox.name = "targetBox";
        targetBox.position.y = 0.7;
        targetBox.isPickable = false;
        dirBox.checkCollisions = true;

        targetBox.setParent(dirBox);
        this.player = dirBox;
        targetBox.visibility = 0;
        dirBox.visibility = 0;
        this.camera.setTarget(targetBox);
        this.camera.beta = 0; // 俯视角度，角度越小看的目标越接近脚下
        this.camera.alpha = 0;
        this.camera.radius = 0;

        this.player.position.x = 8.95;
        this.player.position.y = 1.3;
        this.player.position.z = 3.63;

        const shape = new PhysicsShapeBox(
            new Vector3(0, 0, 0),
            Quaternion.Identity(),
            new Vector3(0.1, 1, 0.1),
            this.scene
        );
        physicsBody = new PhysicsBody(this.player,PhysicsMotionType.DYNAMIC,false, this.scene);
        physicsBody.shape = shape;
        physicsBody.setMassProperties({
            mass: 1,
            centerOfMass: new Vector3(0, 0, 0),
            inertia: new Vector3(0, 0, 0),
            inertiaOrientation: new Quaternion(0, 0, 0, 1)
        });

        // 键盘控制人物前后左右行走
        this.initKey();
        // 更新
        this.scene.registerBeforeRender(() => {
            !this.locked && this.update();
        });
    }

    private initKey() {
        window.addEventListener('keydown', this.handleKeyDown.bind(this), false);
        window.addEventListener('keyup', this.handleKeyUp.bind(this), false);
    }

    private handleKeyDown(evt: any) {
        if (this.locked) {
            return;
        }
        if (evt.keyCode == 65 || evt.key == 'ArrowLeft') this.keys.left = 1;
        this.walk(); // A
        if (evt.keyCode == 68 || evt.key == 'ArrowRight') this.keys.right = 1;
        this.walk(); // D
        if (evt.keyCode == 87 || evt.key == 'ArrowUp') this.keys.forward = 1;
        this.walk(); // W
        if (evt.keyCode == 83 || evt.key == 'ArrowDown') this.keys.back = 1;
        this.walk(); // S
        if (evt.keyCode == 70) this.sitdown(); // P	80 F 70
        if (evt.keyCode == 16) this.speedNum = 0.05; // shift

        if (this.action !== evt.keyCode) {
            this.action = evt.keyCode
        }
    }

    private handleKeyUp(evt: any) {
        if (this.locked) {
            return;
        }

        if (evt.keyCode == 65 || evt.key == 'ArrowLeft') this.keys.left = 0;
        this.idle();
        if (evt.keyCode == 68 || evt.key == 'ArrowRight') this.keys.right = 0;
        this.idle();
        if (evt.keyCode == 87 || evt.key == 'ArrowUp') this.keys.forward = 0;
        this.idle();
        if (evt.keyCode == 83 || evt.key == 'ArrowDown') this.keys.back = 0;
        this.idle();
        if (evt.keyCode == 16) this.speedNum = 0.02;

        this.action = evt.keyCode
    }

    public walk() {
        this.speed = this.speedNum;
    }

    public idle() {
    }

    public sitdown() {
    }

    public update() {
        if (!this.player || !this.player.position) {
            return;
        }

        const cameraForwardRayPosition = this.camera.getForwardRay().direction;
        const cameraForwardRayPositionWithoutY = new Vector3(cameraForwardRayPosition.x, 0, cameraForwardRayPosition.z);
        if (this.player.physicsImpostor) {
            this.player.physicsImpostor?.setLinearVelocity(new Vector3(0, 0, 0));
            this.player.physicsImpostor?.setAngularVelocity(new Vector3(0, 0, 0));
        }
        // 键盘操作
        let forwardVec = new Vector3(cameraForwardRayPosition.x * this.speed, 0, cameraForwardRayPosition.z * this.speed);
        if (this.keys) {
            if (this.keys.left) {
                // this.player.moveWithCollisions(this.rotateY(forwardVec, 270));
                physicsBody.applyImpulse(
                    this.rotateY(forwardVec, 270),
                    new Vector3()
                )
            }
            if (this.keys.right) {
                // this.player.moveWithCollisions(this.rotateY(forwardVec, 90));
                physicsBody.applyImpulse(
                    this.rotateY(forwardVec, 90),
                    new Vector3()
                )
            }
            if (this.keys.forward) {
                // this.player.position.y = 1.3;
                this.player.lookAt(this.player.position.add(cameraForwardRayPositionWithoutY), 0, 0, 0)
                // this.player.moveWithCollisions(forwardVec);
                physicsBody.applyImpulse(
                    forwardVec,
                    new Vector3()
                )
            }
            if (this.keys.back) {
                // this.player.position.y = 1.3;
                this.player.lookAt(this.player.position.add(cameraForwardRayPositionWithoutY), 0, 0, 0)
               // this.player.moveWithCollisions(new Vector3(forwardVec.x * -1, forwardVec.y, forwardVec.z * -1));

                physicsBody.applyImpulse(
                    new Vector3(forwardVec.x * -1, forwardVec.y, forwardVec.z * -1),
                    new Vector3()
                )
            }
        }
    }

    private rotateY(v: Vector3, degree: number) {
        const angle = degree * Math.PI / 180;
        const x = v.x * Math.cos(angle) - v.z * Math.sin(angle);
        const z = v.x * Math.sin(angle) + v.z * Math.cos(angle);
        return new Vector3(x, v.y, z);
    }
}