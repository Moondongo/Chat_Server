import fs from 'fs';
import { createServer } from "http";
import { Server } from "socket.io";

let rooms;
try{
    rooms = JSON.parse(fs.readFileSync('database.json'));
}catch{
    rooms = {}
}

const httpServer = createServer();
const io = new Server(httpServer, {
    cors: {
        origin: ["http://127.0.0.1:5500", "https://moondongo.github.io"],
        credentials: true
    }
});

io.on("connection", (socket) => {
    const room = socket.handshake.headers.origin //obtengo el dominio del cliente
    if(!(room in rooms)) rooms[room] = []; //Si no existe la sala, la creo en mi objeto ROOMS
    socket.join(room);  //agregar al cliente a su propia sala (la de su dominio)

    socket.emit("historial_mensaje", rooms[room]); //le envio el historial de mensaje de esa sala    

    socket.on("nuevo_mensaje", (message) => {
        message['date'] = Date.now();
        io.to(room).emit("difundir_mensaje", message);

        if(rooms[room].length > 50) rooms[room].shift(); //limito el historial de mensaje de cada sala
        rooms[room].push(message)

        fs.writeFile("database.json", JSON.stringify(rooms, null, 2), (err) => {
            if (err) throw err;
            console.log('Data written to file');
        })
    });
    
});

httpServer.listen(3000, () => {
    console.log('Server en Marcha')
});



