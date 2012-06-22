var socket, game, chat;
var assets = {images: [], sounds: []}

var nw = {init: window.webkitNotifications, timer: null, msg: '', title: '', ex: null, icon: 'http://dev.chromium.org/_/rsrc/1220198801738/config/app/images/customLogo/customLogo.gif', show: function(){
	var pop = nw.init.createNotification(nw.icon, nw.title, nw.msg);
	pop.ondisplay = function() {
		setTimeout(function(){
			pop.cancel();
			pop = null;
		},3000);
	};
	pop.show();
}}

$(function() {
	connectServer();
	$(window).unload(function(){
		socket.close();
	});		
});

function connectServer() {
    var socket = io.connect('http://webapi.us:2003');
    console.log(socket);
    socket.on('data', onDataReceived);
}

function send(data) {
    socket.emit('data', data); 
}

function onConnected() {
    send({ action:"test" });
    lobby = new Lobby();
    chat = new Chat();
}

function onDataReceived(j) {
    console.log(j);
    if (j.dest == 'lobby')
        lobby.getData(j);
    if (j.dest == 'game')
        game.getData(j);
    if (j.dest == 'chat')
        chat.getData(j);
}

function onDisconnect() {
    $('.info').text('Lost connection to server. Please try again later.');
}

function notify(msg) {
    if (!window.webkitNotifications) return;
    nw.title =  'Halma';
    nw.msg = msg;
    if(!nw.init.checkPermission()) { nw.show(); }   
}

function checkSupport() {
    if (!Modernizr.websockets) {
        $('body').append('<div id="overlay"><div class="info"></div></div>');
        $('#overlay .info').html('<h1>Your browser is outdated!</h1>\
            <p>Your browser does not support <b>websockets</b>.</p>\
            <p>Please grab supported browser from one of the vendors below:</p>\
            <div class="browsers"><a href="http://www.google.com/chrome/" target="_blank"><div class="chrome"></div></a>\
            <a href="http://www.apple.com/safari" target="_blank"><div class="safari"></div></a>');
        return false;
    }
    return true;    
}


/****
 * Chat class
 *
 ****/

function Chat() {	
	this.getData = function(j) {
		if (j.msg && j.msg.length)
			$('#side .chat .text').append('<p><b>Opp</b>: '+j.msg+'</p>');	
	}
	
	var say = function(e) {
		if (e.keyCode != '13') return;
		var msg = $('#side .chat input').val();
		$('#side .chat .text').append('<p><b>You</b>: '+msg+'</p>');
		var str = '{"action":"chat","msg":"'+msg+'"}';
		send(str);	
	}
	
	var init = function() {
		$('#side .chat input').keyup(say);
	}();
}



