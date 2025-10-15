<script lang="ts">
    import {onMount} from "svelte";
    import App from "./babylon/app";
    import ViewPort from "./babylon/viewport";
    import {_WebSocket} from "./utils/websocket";
    import {DeviceRunData} from "./utils/deviceRunData";

    let canvasElement: HTMLCanvasElement,
        vp: ViewPort;

    onMount(() => {
        const ws = new _WebSocket(import.meta.env.VITE_GLOB_WS_URL,{
            reconnectLimit: 5,
            reconnectInterval: 2000
        });
        ws.connect();

        const deviceRunData = new DeviceRunData(ws);

        window.App = new App(canvasElement);
        window.App.createEngineFactory().then(engine => {
            vp = new ViewPort(engine,canvasElement,deviceRunData);
        });

        return () => {
            window.App.dispose();
            window.App = undefined;

            vp.dispose();
            vp = undefined;

            ws.close();
        }
    })
</script>

<div id="viewport">
    <canvas bind:this={canvasElement}></canvas>
</div>

<style>

</style>
