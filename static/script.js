var ws;

var chords = [];

for (var i = 1; i <= 16; i++) {
	chords[i - 1] = new Audio('/Chords/' + i + '.wav');
}

function startGame() {
    var loc = window.location, new_uri;

    if (loc.protocol === "https:") {
        new_uri = "wss:";
    } else {
        new_uri = "ws:";
    }
    new_uri += "//" + loc.host;
    new_uri = new_uri.substring(0, new_uri.length - 1) + "1";

    ws = new WebSocket(new_uri + '/ws');

    ws.onopen = function() {
        console.log('connected');
        myGameArea.start();
    };

    ws.onmessage = function(data) {
        var json;

        try {
            json = JSON.parse(data.data);
        } catch (err) {
            console.error("Could not parse JSON: " + data + "\n", err);
        }

        switch(json.response) {
            case 'welcome':
                myGameArea.player_name = json.data;
                break;

            case 'state':
                myGameArea.height = json.height;
                myGameArea.width = json.width;
                myGameArea.pieces = json.pieces;

                myGameArea.pieces.forEach((p) => {
                    if (p.name === 'player1') {
                        myGameArea.player1 = p;
                    } else if (p.name === 'player2') {
                        myGameArea.player2 = p;
                    } else if (p.name === 'ball') {
                        myGameArea.ball = p;
                    }
                });

                if (myGameArea.player_name === 'player1')
                    myGameArea.player = myGameArea.player1;
                else
                    myGameArea.player = myGameArea.player2;

                switch (json.state) {
                    case 'stopped':
                        break;
                    case 'start':
                        break;
                    case 'progress':
                        break;
                }
                myGameArea.state = json.state;

                break;

	        case 'sound':
	        	console.log(json);
	        	// chords[json.data].load();
		        new Audio('/Chords/' + json.data + '.wav').play();
	        	// chords[json.data].play();
	        	break;
        }

        updateGameArea();
    };
}

function updateComponent(comp) {
    ctx = myGameArea.context;
    ctx.fillStyle = comp.color;
    ctx.fillRect(comp.x, comp.y, comp.width, comp.height);

}

var myGameArea = {
    canvas : document.createElement("canvas"),
    start : function() {
        this.pieces = [];
        this.canvas.width = 480;
        this.canvas.height = 270;
        this.context = this.canvas.getContext("2d");

        this.canvas.style = 'border: 1px solid black';

        document.body.appendChild(this.canvas);
        // this.interval = setInterval(updateGameArea, 20);

        window.addEventListener('keydown', function (e) {
            myGameArea.key = e.keyCode;

            // if (myGameArea.key == 37) {myGameArea.player.speedX = -1; }
            // if (myGameArea.key == 39) {myGameArea.player.speedX = 1; }
            if (myGameArea.key == 38) {myGameArea.player.speedY = -1; }
            if (myGameArea.key == 40) {myGameArea.player.speedY = 1; }

            ws.send(JSON.stringify({ request: "move", speedX: myGameArea.player.speedX, speedY: myGameArea.player.speedY }));
        });
        window.addEventListener('keyup', function (e) {
            myGameArea.key = e.keyCode;
            // if (myGameArea.key == 37) {myGameArea.player.speedX += 1; }
            // if (myGameArea.key == 39) {myGameArea.player.speedX -= 1; }
            if (myGameArea.key == 38) {myGameArea.player.speedY += 1; }
            if (myGameArea.key == 40) {myGameArea.player.speedY -= 1; }

            ws.send(JSON.stringify({ request: "move", speedX: myGameArea.player.speedX, speedY: myGameArea.player.speedY }));
        });
    },
    clear : function() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
};

function updateGameArea() {
    myGameArea.clear();

    if (myGameArea.pieces)
        myGameArea.pieces.forEach(function(p) {
            updateComponent(p);
        });
}

startGame();