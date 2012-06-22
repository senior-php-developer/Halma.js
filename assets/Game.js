function Game(c,p) {
    var BOARD_WIDTH = 9, BOARD_HEIGHT = 9, PIECE_WIDTH = 50, PIECE_HEIGHT = 50;
    var canvas, ctx, ptn, pieces, enemy, num_pieces, selpiece_index, selpiece_moved, info, canplay, combo, bottom, top;
    
    var init = function(c, p) {
        canvas = c;
        info = p;
        canvas.width = 350;
        canvas.height = 350;
        $(canvas).show();
        $('#main .status button.skip').click(skipTurn);
        ctx = canvas.getContext('2d');
    }
    
    var initBoard = function(s) {
        assets.sounds.pop = document.createElement('audio'); 
        assets.sounds.pop.setAttribute('src','http://games.airy.me/ships/assets/pop.mp3');
        assets.sounds.pop.load();   
        
        if (typeof s != 'undefined') {
            BOARD_WIDTH = BOARD_HEIGHT = s;
            PIECE_WIDTH = PIECE_HEIGHT = 345 / s;
        }
        bottom = [new Cell(BOARD_HEIGHT - 3, 0), new Cell(BOARD_HEIGHT - 2, 0), new Cell(BOARD_HEIGHT - 1, 0),
                                    new Cell(BOARD_HEIGHT - 3, 1), new Cell(BOARD_HEIGHT - 2, 1),   new Cell(BOARD_HEIGHT - 1, 1),
                                    new Cell(BOARD_HEIGHT - 3, 2), new Cell(BOARD_HEIGHT - 2, 2),   new Cell(BOARD_HEIGHT - 1, 2)];
        top = [new Cell(0, BOARD_WIDTH - 3), new Cell(0, BOARD_WIDTH - 2),  new Cell(0, BOARD_WIDTH - 1),
                                    new Cell(1, BOARD_WIDTH - 3), new Cell(1, BOARD_WIDTH - 2), new Cell(1, BOARD_WIDTH - 1),
                                    new Cell(2, BOARD_WIDTH - 3), new Cell(2, BOARD_WIDTH - 2), new Cell(2, BOARD_WIDTH - 1)];
        $('#side .lobby, #side .newgame').slideUp(function(){
            $('#side .chat').slideDown();
            $('#main .status button').show();
        });
    }
    
    var loadImages = function(s) {
        var sizes = {'9':'32','11':'24','14':'16'};
        var progress = 0;
        
        var onImageLoaded = function(e) {
            progress += 100/assets.images.length;
            //$(info).text('Loading.. '+progress+'%');
            if (progress > 99)
                newGame();
        }
        
        for(var i=0; i<3; i++) {
            assets.images[i] = new Image();
            $(assets.images[i]).bind('load', onImageLoaded);
        }
        assets.images[0].src = 'http://games.airy.me/halma/assets/img/g'+sizes[s]+'.png'; // enemy
        assets.images[1].src = 'http://games.airy.me/halma/assets/img/b'+sizes[s]+'.png'; // own
        assets.images[2].src = 'http://games.airy.me/halma/assets/img/y'+sizes[s]+'.png'; // selected
        
    }
    
    this.getData = function(j) {
        
        if (j.type == 'create') {
            initBoard(j.size);
            pieces = bottom;
            enemy = top;
            canplay = false;
            $(info).text('Wait for Player 2');
            loadImages(j.size);
            
        }
        if (j.type == 'join') {
            initBoard(j.size);
            pieces = top;
            enemy = bottom;
            canplay = false;
            $(info).text('Please wait');    
            loadImages(j.size);
        }
        if (j.type == 'joined') {
            canplay = true;
            $(info).text('Your turn');
        }
        if (j.type == 'move') {
            enemy = j.pos;
            canplay = (j.canplay == 'true');
            if (canplay) {
                $(info).text('Your turn');
                assets.sounds.pop.play();
            }
            combo = false;
            drawBoard();
        }
        if (j.type == 'end') {
            lobby = new Lobby();
        }
        if (j.type == 'gameover') {
            if (j.who == 'you') {
                $(info).text('You won');
            } else {
                enemy = j.pos;
                drawBoard();
                $(info).text('You lost');
            }
        
        }
    }
    
    var newGame = function() {
        $(canvas).mousedown(boardClicked);
        num_pieces = pieces.length;
        selpiece_index = -1;
        selpiece_moved = false;
        drawBoard();
    }

    
    var Cell = function(row, column) {
        this.row = row;
        this.column = column;
    }
    
    var getPosition = function(e) {
        x = e.pageX - canvas.offsetLeft - $('.wrap')[0].offsetLeft - 16;
        y = e.pageY - canvas.offsetTop - $('.wrap')[0].offsetTop - 16;
        x = Math.min(x, BOARD_WIDTH * PIECE_WIDTH);
    y = Math.min(y, BOARD_WIDTH * PIECE_WIDTH);
        var cell = new Cell(Math.floor(y/PIECE_HEIGHT), Math.floor(x/PIECE_WIDTH));
        return cell;
    }
    
    var encodePosition = function(pieces) {
        var str = '{"pos":[';
        for (var i=0; i<pieces.length; i++) {
            str += '{"row":"'+pieces[i].row+'","column":"'+pieces[i].column+'"},';
        }   
        str += '[]],"action":"move","moved":"'+!selpiece_moved+'","width":"'+BOARD_WIDTH+'","height":"'+BOARD_HEIGHT+'"}';
        return str;
        
    }
    
    var boardClicked = function(e) {
        if (!canplay) return;
        clearTimeout(nw.timer);
        var cell = getPosition(e);
        for (var i=0; i<enemy.length;i++) {
            if (enemy[i].row==cell.row && enemy[i].column==cell.column) {
                drawBoard();
                return;
            }
        }
        for (var i=0; i<num_pieces;i++) {
            if (pieces[i].row==cell.row && pieces[i].column==cell.column) {
                if (i == selpiece_index && combo)
                    releasePiece(i);
                else {
                    clickPiece(i);
                }
                return;
            }   
        }
        clickEmpty(cell);
    }
    
    var clickPiece = function(i) {
        if (selpiece_index == i) return;
        if (combo)
            return releasePiece();
        selpiece_index = i;
        selpiece_moved = false;
        combo = false;
        drawBoard();
    }
    
    var releasePiece = function() {
        selpiece_index = -1;
        selpiece_moved = false;
        combo = false;
        canplay = false;
        $(info).text('Please wait');
        send(encodePosition(pieces));
        drawBoard();    
    }
    
    var skipTurn = function() {
        selpiece_moved = false;
        releasePiece();
    }
        
    var clickEmpty = function(cell) {
        if (selpiece_index == -1) return;
        var row_diff = Math.abs(cell.row - pieces[selpiece_index].row);
        var col_diff = Math.abs(cell.column - pieces[selpiece_index].column);
        if (row_diff <= 1 && col_diff <= 1) {
            pieces[selpiece_index].row = cell.row;
            pieces[selpiece_index].column = cell.column;
            return releasePiece();
        }
        
        if (((row_diff == 2 && col_diff == 0) || (row_diff == 0 && col_diff == 2) || (row_diff == 2 && col_diff == 2)) &&
        isPieceBetween(pieces[selpiece_index],cell)) {
            selpiece_moved = true;
            pieces[selpiece_index].row = cell.row;
            pieces[selpiece_index].column = cell.column;
            drawBoard();
            combo = true;
            send(encodePosition(pieces));
            return;
        }
        
        //selpiece_index = -1;
        //selpiece_moved = false;
        drawBoard();
        
    }
    
    var isPieceBetween = function(c1, c2) {
        var row_btw = (c1.row+c2.row)/2;
        var col_btw = (c1.column+c2.column)/2;
        for (var i=0; i<num_pieces;i++) {
            if (pieces[i].row == row_btw && pieces[i].column == col_btw) return true;
        }
        for (var i=0; i<enemy.length;i++) {
            if (enemy[i].row == row_btw && enemy[i].column == col_btw) return true;
        }
        
        return false;
    }
    
    
    var isGameover = function() {
        return false;
    
    }

    
    var drawBoard = function() {
        var cwidth = 1 + (BOARD_WIDTH * PIECE_WIDTH);
        var cheight = 1 + (BOARD_HEIGHT * PIECE_HEIGHT);
        if (isGameover())
            endGame();
        
        ctx.clearRect(0,0, cwidth, cheight);
        ctx.beginPath();
        
        for (var x=0; x<= cwidth; x+= PIECE_WIDTH) {
            ctx.moveTo(0.5+x,0);
            ctx.lineTo(0.5+x,cheight);
        }

        for (var y=0; y<= cheight; y+= PIECE_HEIGHT) {
            ctx.moveTo(0, 0.5+y);
            ctx.lineTo(cwidth, 0.5+y);
        }
        ctx.strokeStyle = '#ccc';
        ctx.stroke();
        
        for (var i=0; i<9; i++) {
            drawPiece(pieces[i],i==selpiece_index);
        }
        drawEnemy(enemy);
    }
    
    var drawPiece = function(p, sel) {
        var col = p.column;
        var row = p.row;
        var x = col*PIECE_WIDTH+4;
        var y = row*PIECE_HEIGHT+4;
        ctx.beginPath();
        if (sel)
            ctx.drawImage(assets.images[2], x, y);
        else 
            ctx.drawImage(assets.images[1], x, y);
        ctx.closePath();
    }
    
    var drawEnemy = function(p) {
        if (typeof p == 'undefined' || p.length == 0) return;
        for(var i=0; i<p.length; i++) {
            var col = p[i].column;
            var row = p[i].row;
            var x = col*PIECE_WIDTH+4;
            var y = row*PIECE_HEIGHT+4;
            ctx.beginPath();
            ctx.drawImage(assets.images[0], x, y);
            ctx.closePath();            
        }
    }
    
    init(c,p);
}