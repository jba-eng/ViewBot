let createProxyTester;

(async () => {
    createProxyTester = (await import("fast-proxy-tester")).createProxyTester;
})();



const ytdl = require("@ybd-project/ytdl-core");

const ProxyAgent = require("proxy-agent-v2");
const axios = require("axios");

const { Writable } = require("stream");
let nullPipe = new Writable({ write: (a, b, cb) => cb() })
nullPipe.setMaxListeners(0)

function convertProxyFormat(proxyString) {
    if (!proxyString) return proxyString;
    let protocol = "http";
    let workingString = proxyString;
    if (proxyString.includes("://")) {
        let protocolParts = proxyString.split("://");
        protocol = protocolParts[0];
        workingString = protocolParts[1];
    }
    
    if (protocol === "socks5h") protocol = "socks5";
    if (protocol === "socks4h") protocol = "socks4";
    
    let parts = workingString.split(":");
    if (parts.length === 4) {
        return `${protocol}://${parts[2]}:${parts[3]}@${parts[0]}:${parts[1]}`;
    }
    return `${protocol}://${workingString}`;
}


function checkProxies(proxies) {
    return new Promise(async (resolve, reject) => {
        proxies = proxies.filter((v) => v.url !== "direct://");
        proxies = [...new Set(proxies)];

        let localIP = "";
        try {
            const res = await axios.get("https://api64.ipify.org", { timeout: 10000 });
            localIP = res.data.trim();
        } catch (e) {
            console.error("Failed to fetch local IP for pre-flight privacy checks:", e.message);
        }

        let resolved = false
        let finished = 0
        let needed = proxies.length

        if (needed == 0) return resolve()

        let workIndex = 0;
        let elementsDone = 0;
        let concurrencyLimit = 50;
        let workArray = []
        let workingOn = []

        setTimeout(() => {
            if (!resolved) {
                for (let proxy of workingOn) {
                    proxyStats.bad.push({ url: proxy.url, err: `proxy is too slow, last stage: ${proxy.stage}` })
                    proxyStats.untested = proxyStats.untested.filter((v) => v.url !== proxy.url)
                }
                io.emit("newProxiesStats", proxyStats)
                resolved = true
                resolve()
            }
        }, ((settings.timeout * 1000) + 1000) * 3)

        for (let proxy of proxies) {
            workingOn.push({url: proxy.url, stage: "default"});

            workArray.push(() => new Promise(async (resolve, reject) => {
                proxy = proxy.url

                let formattedProxy = convertProxyFormat(proxy)
                let tester = new createProxyTester(formattedProxy, settings.timeout * 1000)

                children.push({
                    kill: () => {
                        workingOn = workingOn.filter((p) => p.url !== proxy)
                        resolved = true
                        resolve()
                    },
                });

                try {
                    function onError(error) {
                        throw error
                    }

                    let currentWorkingOn = workingOn.findIndex((v) => v.url === proxy);
                    workingOn[currentWorkingOn].stage = "checking proxy format (1)"

                    let urlStatus = tester.testProxyURL(formattedProxy);
                    if (!urlStatus.isValid) {
                        proxyStats.bad.push({ url: proxy, err: "Proxy is malformed" })
                        proxyStats.untested = proxyStats.untested.filter((v) => v.url !== proxy)

                        io.emit("newProxiesStats", proxyStats)
                        return
                    }

                    currentWorkingOn = workingOn.findIndex((v) => v.url === proxy);
                    workingOn[currentWorkingOn].stage = "performing Mullvad exit/ASN audit (2b)"

                    const agent = new ProxyAgent(convertProxyFormat(proxy));
                    let mullvadData;
                    try {
                        const mullvadRes = await axios.get("https://am.i.mullvad.net/json", {
                            httpAgent: agent,
                            httpsAgent: agent,
                            timeout: settings.timeout * 1000
                        });
                        mullvadData = mullvadRes.data;
                    } catch (err) {
                        proxyStats.bad.push({ url: proxy, err: "Mullvad exit/ASN check failed: " + err.message })
                        proxyStats.untested = proxyStats.untested.filter((v) => v.url !== proxy)
                        io.emit("newProxiesStats", proxyStats)
                        return
                    }

                    if (mullvadData) {
                        if (mullvadData.mullvad_exit_ip) {
                            proxyStats.bad.push({ url: proxy, err: "Proxy is a Mullvad exit node" })
                            proxyStats.untested = proxyStats.untested.filter((v) => v.url !== proxy)
                            io.emit("newProxiesStats", proxyStats)
                            return
                        }
                        if (mullvadData.blacklisted && mullvadData.blacklisted.blacklisted) {
                            proxyStats.bad.push({ url: proxy, err: "Proxy is blacklisted on Mullvad" })
                            proxyStats.untested = proxyStats.untested.filter((v) => v.url !== proxy)
                            io.emit("newProxiesStats", proxyStats)
                            return
                        }
                        const org = mullvadData.organization ? mullvadData.organization.toLowerCase() : "";
                        const badOrgs = ["amazon", "digitalocean", "linode", "google", "microsoft", "ovh", "hetzner", "leaseweb", "choopa", "m247", "host"];
                        if (badOrgs.some(bad => org.includes(bad))) {
                            proxyStats.bad.push({ url: proxy, err: "Proxy datacenter/hosting network: " + mullvadData.organization })
                            proxyStats.untested = proxyStats.untested.filter((v) => v.url !== proxy)
                            io.emit("newProxiesStats", proxyStats)
                            return
                        }
                    }

                    currentWorkingOn = workingOn.findIndex((v) => v.url === proxy);
                    workingOn[currentWorkingOn].stage = "checking proxy privacy (2)"

                    let privacy = await tester.testPrivacy(localIP).catch(() => {
                        if (mullvadData && mullvadData.ip) {
                            return {
                                privacy: (localIP && mullvadData.ip === localIP) ? "transparent" : "elite",
                                ip: mullvadData.ip,
                                location: mullvadData
                            };
                        }
                        throw new Error("timeout checking proxy privacy");
                    });

                    if (privacy.privacy !== "elite") {
                        proxyStats.bad.push({ url: proxy, err: "Proxy is leaking IP address" })
                        proxyStats.untested = proxyStats.untested.filter((v) => v.url !== proxy)

                        io.emit("newProxiesStats", proxyStats)
                        return
                    }

                    currentWorkingOn = workingOn.findIndex((v) => v.url === proxy);
                    workingOn[currentWorkingOn].stage = "performing Google GWS pre-flight audit (2c)"

                    let googleRes;
                    try {
                        googleRes = await axios.get("https://www.google.com", {
                            httpAgent: agent,
                            httpsAgent: agent,
                            timeout: settings.timeout * 1000,
                            headers: {
                                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                            }
                        });
                    } catch (err) {
                        proxyStats.bad.push({ url: proxy, err: "Google GWS pre-flight validation timed out or failed: " + err.message })
                        proxyStats.untested = proxyStats.untested.filter((v) => v.url !== proxy)
                        io.emit("newProxiesStats", proxyStats)
                        return
                    }

                    if (googleRes.status !== 200) {
                        proxyStats.bad.push({ url: proxy, err: "Google GWS validation status: " + googleRes.status })
                        proxyStats.untested = proxyStats.untested.filter((v) => v.url !== proxy)
                        io.emit("newProxiesStats", proxyStats)
                        return
                    }

                    const resolvedUrl = googleRes.request && googleRes.request.res ? googleRes.request.res.responseUrl || "" : "";
                    if (resolvedUrl.includes("/sorry/index") || resolvedUrl.includes("sorry.google.com")) {
                        proxyStats.bad.push({ url: proxy, err: "Proxy is CAPTCHA-blocked by Google (sorry page redirect)" })
                        proxyStats.untested = proxyStats.untested.filter((v) => v.url !== proxy)
                        io.emit("newProxiesStats", proxyStats)
                        return
                    }

                    const serverHeader = googleRes.headers["server"] || "";
                    if (!serverHeader.toLowerCase().includes("gws")) {
                        proxyStats.bad.push({ url: proxy, err: "Google GWS signature validation failed: " + serverHeader })
                        proxyStats.untested = proxyStats.untested.filter((v) => v.url !== proxy)
                        io.emit("newProxiesStats", proxyStats)
                        return
                    }

                    currentWorkingOn = workingOn.findIndex((v) => v.url === proxy);
                    workingOn[currentWorkingOn].stage = "checking www.youtube.com connection (3)"

                    let test1Result = await tester.fastTest(`https://www.youtube.com`).catch(() => onError("timeout connecting to youtube servers"))
                    if (test1Result.status !== 200) {
                        proxyStats.bad.push({ url: proxy, err: "Proxy is unable to connect to youtube servers" })
                        proxyStats.untested = proxyStats.untested.filter((v) => v.url !== proxy)

                        io.emit("newProxiesStats", proxyStats)
                        return
                    }

                    await new Promise((resolve, reject) => {
                        let resolved = false

                        currentWorkingOn = workingOn.findIndex((v) => v.url === proxy);
                        workingOn[currentWorkingOn].stage = "11 megabits youtube video download (4)"

                        /*try {
                            ytdl('http://www.youtube.com/watch?v=dQw4w9WgXcQ', {
                                range: {
                                    start: 0,
                                    end: ((1000 * 1000) / 8) * 2 * 5 // 11 megabits (aprox 5 seconds)
                                },
                                quality: 'lowest',
                                requestOptions: { agent: new ProxyAgent(convertProxyFormat(proxy)) }
                            })
                                .pipe(nullPipe)
                                .on("close", () => {
                                    if (!resolved) {
                                        resolve()
                                        resolved = true
                                    }
                                })
                                .on("error", () => {
                                    resolved = true;

                                    reject("timeout requesting video data")
                                })
                        } catch (err) {
                            resolved = true;

                            reject("timeout requesting video data")                      
                        }*/

                            resolve()
                            resolved = true

                        setTimeout(() => {
                            if (!resolved) {
                                resolved = true;

                                reject("timeout requesting video data")
                            }
                        }, 1000 * settings.timeout)
                    }).catch(onError)

                    proxyStats.good.push({ url: proxy, latency: test1Result.latency })
                    proxyStats.untested = proxyStats.untested.filter((v) => v.url !== proxy)

                    finished++
                    good_proxies = proxyStats.good
                    db.prepare("UPDATE good_proxies SET data = ? WHERE id = 1").run(JSON.stringify(good_proxies))
                    io.emit("newProxiesStats", proxyStats)

                    resolve()
                } catch (error) {
                    workingOn = workingOn.filter(p => p.url !== proxy)
                    finished++

                    if (!resolved) {
                        let errMsg = typeof error === "string" ? error : (error && error.message) || "unknown error";
                        if (errMsg.includes("timeout")) {
                            proxyStats.bad.push({ url: proxy, err: errMsg })
                            proxyStats.untested = proxyStats.untested.filter((v) => v.url !== proxy)

                            io.emit("newProxiesStats", proxyStats)
                        } else {
                            proxyStats.bad.push({ url: proxy, err: errMsg })
                            proxyStats.untested = proxyStats.untested.filter((v) => v.url !== proxy)

                            io.emit("newProxiesStats", proxyStats)
                        }

                        resolve()
                    }
                }
            }))
        }

        function processElement(index) {
            if (index >= workArray.length)
                return

            let work = workArray[index]
            work().then(() => {
                workIndex += 1
                elementsDone += 1

                processElement(workIndex)
                if (elementsDone >= workArray.length) {
                    resolve()
                }
            }).catch(() => {
                workIndex += 1
                elementsDone += 1

                processElement(workIndex)
                if (elementsDone >= workArray.length) {
                    resolve()
                }
            })
        }

        for (let index = 0; index < concurrencyLimit; index++) {
            if (index >= workArray.length)
                return

            workIndex = index;
            processElement(index)
        }
    })
}

module.exports = { checkProxies }