const express = require('express');
const { ExpressPeerServer } = require('peer');
const app = express();
const server = require('http').Server(app);

// Statik dosyalar için klasör
app.use(express.static('public'));

// PeerJS sunucusu
const peerServer = ExpressPeerServer(server, {
    debug: true,
    path: '/peerjs'
});

app.use('/peerjs', peerServer);

// Ana sayfa
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/sync.html');
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`Server running on port ${port}`);
}); 