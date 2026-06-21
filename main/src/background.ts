import type { Options } from "./types/options"
import axios from "axios";

import io from 'socket.io-client';
let socket = io("/", {
    autoConnect: true,
    secure: false,
});

let opts: Options = {
    skip_ads_after: [5, 85],
    max_seconds_ads: 60,
    close_server_on_finish: false,
    headless: false,
    api_key: "",
    free_api_key: "",
    concurrency: 3,
    concurrencyInterval: 20,
    timeout: 60,
    disable_proxy_tests: false,
    server_port: 6554,
    stop_spawning_on_overload: true,
    auto_skip_ads: true,
    default_proxy_protocol: "http",
    send_reminders: true,
    enable_sticky_sessions: false,
    use_AV1: false,
    user_agents_categories: [],
    user_agents_selected: [],
    viewport_width: 1366,
    viewport_height: 768,
    device_scale_factor: 1,
    is_mobile_device: false,
    platform: "Win32",
    hardwareConcurrency: 8,
    languages: ["en-US","en"],
    timezone_offset: -300,
    webgl_vendor: "",
    webgl_renderer: "",
    mouse_behavior: "humanized",
    mouse_speed: 1.0,
    mouse_randomness: 0.5,
};

let lastData: Options = structuredClone(opts);
let dataChangeFunc = (opts: any) => { }
let newData = (data: any) => {
    opts = data
}

let dataChanged = (newFunc: any) => dataChangeFunc = newFunc


function publishData() {
    axios.post("/api/settings", opts)
}

axios.get("/api/settings").then((result) => {
    opts = result.data
    lastData = structuredClone(result.data)
    dataChangeFunc(opts)
})

setInterval(() => {
    if (JSON.stringify(opts) !== JSON.stringify(lastData)) {
        lastData = structuredClone(opts)
        publishData()
    }
}, 100)

socket.on("settings", (data) => {
    opts = data
    lastData = structuredClone(opts)

    dataChangeFunc(opts)
})

socket.on("reconnect", () => {
    window.location.reload();
})

export { socket, opts, dataChanged, newData }
