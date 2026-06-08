const { YtdlCore } = require('@ybd-project/ytdl-core');
const ytdl = new YtdlCore();
const rumble = require("rumble-core")

let cache = {}
let blacklist = []

function getYoutubeID(url) {
    let regex = /(youtu.*be.*)\/(watch\?v=|embed\/|v|shorts|)(.*?((?=[&#?])|$))/gm
    let found = regex.exec(url)

    if (found && found.length > 1 && found[3]) {
        url = found[3]
    }

    if (/^[a-zA-Z0-9_-]{10,12}$/.test(url)) {
        return url
    }

    return null
}

function handleYoutube(id, req, res){
    ytdl.getBasicInfo(id, { includesOriginalFormatData: true }).then((videoInfo) => {
        if (videoInfo.formats) {
            for (let format of videoInfo.formats) {
                if (format.originalData) {
                    format.width = format.originalData.width;
                    format.height = format.originalData.height;
                    format.qualityLabel = format.originalData.qualityLabel;
                    format.fps = format.originalData.fps;
                }
            }
        }
        let vFormats = videoInfo.formats ? videoInfo.formats.filter((v) => v.width && v.height) : []
        let vFormat = vFormats.sort((a, b) => a.width - b.width).shift()
        let max_vFormat = vFormats.sort((a, b) => a.width - b.width).pop()

        let thumbnails = videoInfo.videoDetails.thumbnails
        let isShort = vFormat ? (vFormat.width / vFormat.height) < 1 : false
        let isLive = videoInfo.videoDetails.isLiveContent && videoInfo.videoDetails.liveBroadcastDetails && videoInfo.videoDetails.liveBroadcastDetails.isLiveNow

        let result = {
            isRumble: false,
            title: videoInfo.videoDetails.title,
            thumbnail: thumbnails && thumbnails.length > 0 ? thumbnails[thumbnails.length - 1].url : "",
            videoType: (isLive && "livestream") || (isShort && "short") || "normal",
            uploadDate: new Date(videoInfo.videoDetails.uploadDate),
            duration: parseFloat(videoInfo.videoDetails.lengthSeconds) || 0,

            validFilters: {
                is4K: max_vFormat ? max_vFormat.height >= 1440 : false,
                isHD: max_vFormat ? max_vFormat.height >= 1080 : false,
                //is3D: videoInfo.formats.some(format => format.videoDetails && format.videoDetails.projectionType && format.videoDetails.projectionType !== "RECTANGULAR"),
                isHDR: max_vFormat && max_vFormat.colorInfo ? max_vFormat.colorInfo.primaries == "COLOR_PRIMARIES_BT709" : false,
            }
        }

        dbRunWithValues(`INSERT INTO video_cache (data, id) VALUES (?, ?)`, [JSON.stringify(result), id]);
    
        res.json(result)
        cache[id] = result
    }).catch((err) => {
        //db_insert_video.run("false", id)
        //blacklist.push(id)
        console.error("handleYoutube ERROR:", err);

        res.sendStatus(404)
    })
}

function getRumbleID(url) {
    if (url.includes("youtube") || url.includes("youtu.be")) {
        return null;
    }

    let found = url.split("/").pop().split("-").shift()

    if (found && found.length >= 5 && found.length <= 8) {
        if (/^[a-zA-Z0-9]+$/.test(found)) {
            return found
        }
    }

    return null
}

function handleRumble(id, req, res){
    rumble.getInfo(id).then((videoInfo) => {
        let vFormat = videoInfo.video.formats ? videoInfo.video.formats.sort((a, b) => a.width - b.width).shift() : null

        let isShort = vFormat ? (vFormat.width / vFormat.height) < 1 : false
        let isLive = videoInfo.live

        let result = {
            isRumble: true,
            title: videoInfo.video.title,
            thumbnail: (videoInfo.video.thumbnails.sort((a, b) => a.width - b.width).pop() || {}).url,
            videoType: (isLive && "livestream") || (isShort && "short") || "normal",
            uploadDate: videoInfo.video.uploadDate,
            duration: videoInfo.video.duration,

            validFilters: {
                is4K: vFormat ? vFormat.height >= 1440 : false,
                isHD: vFormat ? vFormat.height >= 1080 : false,
            }
        }

        dbRunWithValues(`INSERT INTO video_cache (data, id) VALUES (?, ?)`, [JSON.stringify(result), id]);
    
        res.json(result)
        cache[id] = result
    }).catch((err) => {
        //console.log(err)
        //db_insert_video.run("false", id)
        //blacklist.push(id)
        console.error("handleRumble ERROR:", err);

        res.sendStatus(404)
    })
}

module.exports = async (req, res) => {
    let YoutubeID = getYoutubeID(req.query.id)
    let RumbleID = getRumbleID(req.query.id)

    if(!YoutubeID && !RumbleID) {
        return res.sendStatus(404)
    }

    let id = YoutubeID || RumbleID;
    if (cache[id]) return res.send(cache[id])
    //if (blacklist.includes(id)) return res.sendStatus(404)

    let videoFromDB = await dbGetValues("SELECT data FROM video_cache WHERE id = ?", [id]);
    if(videoFromDB){
        res.json(JSON.parse(videoFromDB.data))
    /*} else if (videoFromDB.data == "false"){
        res.sendStatus(404)*/
    } else {
        if(YoutubeID){
            handleYoutube(YoutubeID, req, res);
        } else{
            handleRumble(RumbleID, req, res)
        }
    }
}