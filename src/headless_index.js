if (typeof globalThis.Blob === 'undefined') {
    globalThis.Blob = class Blob {
        constructor() {}
    };
}
if (typeof globalThis.File === 'undefined') {
    globalThis.File = class File extends globalThis.Blob {
        constructor() {
            super(...arguments);
        }
    };
}

global.require = require('esm')(module);

const fs = require("fs");
const path = require("path");
const ansicolor = require("ansicolor").nice;

global.app_path = path.join(__dirname);

require("../main/server.cjs");


startFullServer().then(() => {
    console.log(ansicolor.green("Headless server started successfully"))
})
