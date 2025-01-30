
const express = require('express');
const next = require('next');
const app = next({ dev:true });
const socketio = require('socket.io');
const handle = app.getRequestHandler();
const PORT = 3000;



app.prepare().then(()=>{
    const server = express();

    server.use(express.urlencoded({extended: true}));
    server.use(express.json());

    server.all('*', (req, res) => handle(req, res));

    const s = server.listen(PORT, (err) => {
        console.log(`> Ready on http://localhost:${PORT}`);}
    );

    const io = socketio(s, {
        cors: {
          origin: "*", // Allow frontend access
          methods: ["GET", "POST"],
        },
      });
   
      
      let shapes = [];
      
      io.on("connection", (socket) => {
        console.log("Client connected:", socket.id);
      
        // Send existing shapes to new clients
        socket.emit("object-changed", shapes);
      
        // Handle incoming shape updates
        socket.on("object-change", (newShapes) => {
          shapes = newShapes;
          socket.broadcast.emit("object-changed", shapes); // Send to all except sender
          console.log("Broadcasting updated shapes:", shapes);
        });
      
        socket.on("disconnect", () => {
          console.log("Client disconnected:", socket.id);
        });
      });
      

});