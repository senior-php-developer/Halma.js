function Lobby() {

    this.getData = function(j) {
        if (j.type == 'listGames') listGames(j);
        if (j.type == 'newgame') onNewGame(j);
    }
    
    var listGames = function(j) {
        if (j.games.length > 0) {
            $('.games').find('h3').remove();
            for(var i=0; i<j.games.length; i++) {
                if (j.games[i][2] == '1')
                    $('#side .games').append('<div class="game open" data-id="'+j.games[i][0]+'">'+j.games[i][1]+' (1P)</div>');
                if (j.games[i][2] == '2')
                    $('#side .games').append('<div class="game closed" data-id="'+j.games[i][0]+'">'+j.games[i][1]+' (2P)</div>');
                }
            }   else {
                $('#side .games').html('<h3>No games found</h3>');  
            }
    }
    
    
    var createGame = function() {
        var t = $('#side .newgame input').val();
        var size = parseInt($('#side .newgame select').val());
        if (size != 11 && size != 14) size = 9;
        var c = $('#c')[0];
        var p = $('.info')[0];
        game = new Game(c,p);
        send('{"action":"create","title":"'+t+'","size":"'+size+'"}');
    }
    
    var onNewGame = function(j) {
        $('.games').find('h3').remove().end().append('<div class="game open" data-id="'+j.games[0]+'">'+j.games[1]+' (1P)</div>');
    }
    
    var joinGame = function(e) {
        var id = $(this).attr('data-id');
        var c = $('#c')[0];
        var p = $('.info')[0];
        game = new Game(c,p);
        send('{"action":"join","game":"'+id+'"}');
    }
    
    var quitGame = function(e) {
        $('#side .chat').slideUp(function(){
            $('#side .lobby, #side .newgame').slideDown();
            $('#main .status button, #main canvas').hide();
        });
        send('{"action":"quit"}');
        send('{"action":"listGames"}'); 
        $('.info').text('You quit the game');
    
    }
    
    var init = function() {
        $('#side .newgame button').click(createGame);
        $('#side .games .game.open').live('click',joinGame);
        $('#main .status button.quit').click(quitGame);
        send('{"action":"listGames"}'); 
    }
    
    setTimeout(init, 1000);
}

