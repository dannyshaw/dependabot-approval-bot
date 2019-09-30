var http = require("http");

setInterval(function() {
    http.get(process.env.KEEP_ALIVE_URL);
}, 300000); // every 5 minutes (300000)
