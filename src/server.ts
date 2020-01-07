import * as express from "express";
import * as socketIO from "socket.io";
import * as path from "path";
import { createServer } from 'http'
import { ParamsDictionary } from "express-serve-static-core";

const app = express();
app.set("port", process.env.PORT || 3000);

let http = createServer(app);
// set up socket.io and bind it to our
// http server.
let io = socketIO(http);

app.get<ParamsDictionary, string, string>("/", (req, res) => {
    res.sendFile(path.resolve("./client/index.html"));
});

// whenever a user connects on port 3000 via
// a websocket, log that a user has connected
io.on("connection", (socket) => {
    console.log("a user connected");
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});

const server = http.listen(3000, () => {
    console.log("listening on *:3000");
});
