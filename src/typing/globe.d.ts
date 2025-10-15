import App from "../babylon/app";

declare global {
    interface Window {
        App:App
    }
}
