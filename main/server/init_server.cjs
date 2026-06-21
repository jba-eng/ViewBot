
const express = require("express");
const helmet = require("helmet");
const bearerToken = require("express-bearer-token");

const neededRanks = require("./vars.cjs").neededRanks;

async function initServer(){
    const { handler } = await import("../build/handler.js");

    app.use(helmet({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false,
    }))
    
    app.use(sessionMiddleware)
    
    app.use(bearerToken())
    app.use(express.json())
    
    app.use(verifyToken)
    
    app.use("/api", route)
    app.use(handler)
    
    async function verifyToken(req, res, next) {
        let paths = req.path.split("/")
    
        let subpath = paths.pop()
        let lastRoute = paths.pop()
    
        let statusRequired = neededRanks[subpath]
    
        if (typeof statusRequired == "undefined" && lastRoute == "api") {
            return res.sendStatus(404)
        }
    
        if (req.token) {
            if (statusRequired > 1) {
                let result = await dbGetValues(`SELECT status FROM keys WHERE key = ?`, req.token);
    
                if (result && result >= statusRequired) {
                    req.goodToken = true
                    return next()
                }
            }
    
            res.sendStatus(403)
        } else {
            return next()
        }
    }
    
    io.use((socket, next) => sessionMiddleware(socket.request, {}, next));
    
    io.use((socket, next) => {
        next();
    });
}

global.initServer = initServer;
