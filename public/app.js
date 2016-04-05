var socket = io();
var gamePiece = '',
    username = '',
    socketId = '',
    isTurn = false,
    gameInProgress = false,
    waitingTimerId,
    waitingCount = 0,
    winningCombos = ['00,01,02', '00,10,20', '00,11,22', '01,11,21', '10,11,12', '20,21,22', '20,11,02', '02,12,22'];

/* user Event
   Anytime a player joins or leaves this event is fired. Based on the 
   number of players it wil either displaying a waiting message or 
   the tic tac toe board. Parameter data conatins the number of players.
*/
socket.on('user', function(data) {
    //If only 1 user or 2 users are already playing 
    //show the waiting message 
    if(data === 1 || !gamePiece) {
        $('#waiting').css('display', 'block');
        $('#gameBoard').css('display', 'none');
        gameInProgress = false; 
            
        waitingTimerId = setInterval(function() {
            if(waitingCount < 3) {
                $('#waiting').text($('#waiting').text() + '.')
                waitingCount++;
            } else {
                $('#waiting').text($('#waiting').text().replace('...', ''));
                waitingCount = 0;
            }
        }, 1000);
    } else { //Display tic tac toe board 
        if(!gameInProgress) {
            $('#waiting').css('display', 'none');
            $('#gameBoard').css('display', 'block');
            gameInProgress = true; 
                
            clearInterval(waitingTimerId);
                
            createGameBoard();
        }
    }
}); 
       
/* playerInfo Event
   When a player joins this event is fired. It sets all 
   of the data for the player. Parameter data is an object 
   containing the user's username, gamie piece, and socketId.
*/
socket.on('playerInfo', function(data) {
    console.log('playerInfo: ' + data.username);
    
    //Set user data 
    username = data.username; 
    gamePiece = data.gamePiece;
    socketId = data.socketId;
    gameInProgress = false; 
});
        
/* moveMade Event
   Anytime a player makes a move this event is fired. It
   updates the game board with the other player's move and
   checks if the game is over. Parameter data is an object 
   containing username, game piece, and location.
*/
socket.on('moveMade', function(data) {
    var doneResult;
    
    //Update game board with new move 
    $('#' + data.location).text(data.gamePiece);
    if(data.gamePiece === 'X') {
        $('#' + data.location).css('color', 'red');
    } else {
        $('#' + data.location).css('color', '#999');
    }
        
    //Check if the game is over 
    doneResult = checkIfDone();
    if(doneResult !== '') {
        $.post('/api/gameOver/' + username, function(data) {
                    
        });
            
        var msgTitle;
            
        if(doneResult === 'tie') {
            msgTitle = 'It\'s a tie!';
        } else if(doneResult === gamePiece) {
            msgTitle = 'Yay! You win!';
        } else {
            msgTitle = 'Too bad! You lose';
        }
            
        swal({   
            title: msgTitle,   
            text: "Would you like to play again?",      
            showCancelButton: true,  
            cancelButtonText: "No",
            confirmButtonColor: "#4cae4c",   
            confirmButtonText: "Yes, play again" 
        }, function(isConfirm) {  
            if(isConfirm) {
                $.post('/api/playAgain/' + encodeURIComponent(socketId), function(data) {
                    
                });
            } else {
                //Can't completely close tab so do this
                var win = window.open("about:blank", "_self");
                win.close(); 
            }
        });
    } else {
        isTurn = !isTurn;    
    }
});

/* createGameBoard Function 
   This function creates the tic tac toe board and attaches 
   the click listener.
*/
function createGameBoard() {
    $('#gameBoard').empty();
    var table = '';
    for(var x = 0; x < 3; x++) {
        table += '<tr>';
        for(var y = 0; y < 3; y++) {
            table += '<td id="' + x + y + '"></td>'
        }
        table += '</tr>';
    }
        
    $('#gameBoard').append(table);
        
    if(gamePiece === 'X') {
        isTurn = true;
    } else {
        isTurn = false; 
    }
        
    //Table cell click handler 
    $('td').click(function() {
        if(isTurn) {
            if(!$(this).text() || $(this).text().trim() === '') {
                $(this).text(gamePiece);
                if(gamePiece === 'X') {
                    $(this).css('color', 'red');
                } else {
                    $(this).css('color', '#999');
                }
                    
                $.post('/api/makeMove/' + username + '/' + gamePiece + '/' + $(this).attr('id'), function(data) {
                    
                });
            } else {
                swal('Sorry, spot taken!');
            } 
        } else {
            swal('Oops! Not your turn')
        }
    });
}


    
/* checkIfDone Function
   Checks if the game is over, either by a player 
   winning or a tie. Returns the winning game piece if
   there is a winner, tie if there is a tie, or '' if 
   the game is not done.
*/
function checkIfDone() {
    var combo,
        matchResult;
        
    //check for win by X or O
    for(var x = 0; x < winningCombos.length; x++) {
        combo = winningCombos[x].split(',');
        matchResult = checkForMatch(combo);
        if(matchResult !== '') {
            return matchResult;
        }
    }
        
    //check for tie 
    return checkForTie();
}
   
/* checkForMatch Function
   Checks if there are three X's or O's in a row causing 
   a winning game. If there is a winner, will return the
   winning game piece else returns ''
*/
function checkForMatch(combo) {
    var item = $('#' + combo[0]).text(),
        matches = 0;
     
    //Check if 3 X's or O's in a row
    if(item && (item === 'X' || item === 'O')) {
        matches++;
        for(var x = 1; x < combo.length; x++) {
            if(item === $('#' + combo[x]).text()) {
                matches++;   
            }
        }    
    }
        
    //If a win, return the winning game piece 
    if(matches === 3) {
        return item;  
    } else {
        return '';
    }
}

/* checkForTie Function
   Checks if the game board is full which will result in a tie. 
   Returns tie if there is a tie or '' if there isn't 
*/
function checkForTie() {
    //Check if game board is full 
    for(var x = 0; x < 3; x++) {
        for(var y = 0; y < 3; y++) {
            if($('#' + x + y).text() !== 'X' && $('#' + x + y).text() !== 'O') {
                return ''; 
            }
        }
    }
        
    return 'tie';
}
