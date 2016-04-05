var express = require('express'),
    app = express(), 
    http = require('http').Server(app),
    io = require('socket.io')(http),
    port = 8080,
    players = [],
    numPlayers = 0;

app.use(express.static('public'));

/* makeMove API 
   Called when a move is made, and it will update all connected clients with that moveMade
   so the game boards will stay in sync 
*/
app.post('/api/makeMove/:username/:gamePiece/:location', function(req, res) {
    var newMove = {
        username: req.params.username, 
        gamePiece: req.params.gamePiece,
        location: req.params.location
    };
    
    io.sockets.emit('moveMade', newMove);
    
    res.end();
});

/* gameOver API 
   Called when the game is over, and it will remove the players from the players array 
*/
app.post('/api/gameOver/:username', function(req, res) {
    removePlayer(req.params.username);
    
    res.end();
});

/* playAgain API 
   Called after a game ends if a player chooses to play again 
*/
app.post('/api/playAgain/:socketId', function(req, res) {
    addPlayer(req.params.socketId);
    
    res.end();
});

/* connection Event 
   Event that fires when a new connection is made to the server, and it will 
   add the new connection to the players array 
*/
io.on('connection', function(socket) {
    var player = addPlayer(socket.id);

    /* disconnection Event 
       Event that fires when a client disconnects, and it will remove 
       that player from the players array 
    */
    socket.on('disconnect', function() {
        removePlayer(player.username);
    });
});

/* addPlayer Function 
   Function that creates a new player based on a socket connection. The player 
   is given a username (randomly generated) and a game piece ('X' or 'O'), then
   the player is added onto the players array and events are emitted to the client
*/
function addPlayer(socketId) {
    //Create new player 
    numPlayers++;
    var player = {};
    player.socketId = socketId;
    player.username = generateUsername();
    
    //Assign game pience ('X' or 'O')
    if(numPlayers === 1) {
        player.gamePiece = 'X';    
    } else if(numPlayers === 2) {
        if(players[0].gamePiece === 'O') {
            player.gamePiece = 'X';
        } else {
            player.gamePiece = 'O';
        }
    }
    
    players.push(player);
    
    io.sockets.connected[socketId].emit('playerInfo', player);
    io.sockets.emit('user', numPlayers);
    
    return player; 
}

/* removePlayer Function 
   Function that removes a player based on their username. After a player 
   is removed, if there are enough players to play a game then game pieces
   are assigned to them if they don't have one. 
*/
function removePlayer(username) {
    //Remove user by username 
    for(var x = 0; x < numPlayers; x++) {
        if(players[x].username === username) {
            players.splice(x, 1);
            numPlayers--;
        }
    }
    
    //If more than 1 player, set game piece for first 2 players
    if(numPlayers > 1) {
        if(!players[0].gamePiece) {
            players[0].gamePiece = 'X';
        }
        io.sockets.connected[players[0].socketId].emit('playerInfo', players[0]);
            
        if(!players[1].gamePiece) {
            if(players[0].gamePiece === 'X') {
                players[1].gamePiece = 'O';
            } else {
                players[1].gamePiece = 'X';
            }
        }
        io.sockets.connected[players[1].socketId].emit('playerInfo', players[1]);
    }
    
    io.sockets.emit('user', numPlayers);
}

/* generateUsername Function 
   Function that creates and returns a username that isn't currently in use
*/
function generateUsername() {
    var uName = 'Player ' + Math.floor((Math.random() * 100) + 1),
        validUsername; 
    
    do {
        validUsername = true;
        for(var x = 0; x < players.length; x++) {
            if(players[x].username === uName) {
                validUsername = false; 
                uName = 'Player ' + Math.floor((Math.random() * 100) + 1);
            }
        }
    } while(!validUsername) 
    
    return uName;
}

/* Listen on specified port */
http.listen(port, function() {
   console.log('Listening on port ' + port); 
});

