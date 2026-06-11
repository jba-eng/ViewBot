export type Options = {
    max_seconds_ads: number,
    skip_ads_after: number[],
    close_server_on_finish: boolean,
    send_reminders: boolean,
    enable_sticky_sessions?: boolean,

    headless: boolean,
    concurrency: number,

    concurrencyInterval: number,
    timeout: number,
    disable_proxy_tests: boolean,

    stop_spawning_on_overload: boolean,
    auto_skip_ads: boolean,
    server_port: number,
    
    api_key: string,
    free_api_key: string,
    default_proxy_protocol: string,

    use_AV1: boolean,
    user_agents_categories?: string[],
    user_agents_selected?: string[],
    viewport_width?: number,
    viewport_height?: number,
    device_scale_factor?: number,
    is_mobile_device?: boolean,
    platform?: string,
    hardwareConcurrency?: number,
    languages?: string[],
    timezone_offset?: number,
    webgl_vendor?: string,
    webgl_renderer?: string,
    mouse_behavior?: "automated" | "humanized" | "random",
    mouse_speed?: number,
    mouse_randomness?: number,
};
