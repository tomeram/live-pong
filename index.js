'use strict';

let path    = require('path');
let express = require('express');
const websocket = require('ws');
let app = express();


const wss = new websocket.Server({
    perMessageDeflate: false,
    port: 3001
});

let ws1, ws2;

wss.on('connection', (ws) => {

    if (!ws1) {
        ws1 = ws;

        ws.send(JSON.stringify({"response": "welcome", "data": "player1"}))
    } else if (!ws2) {
        ws2 = ws;

        ws.send(JSON.stringify({"response": "welcome", "data": "player2"}))
    }

    if (ws1 && ws2) {
        startGame();
    }

    broadcastGame();

    myGame.state = 'progress';

    ws.on('message', (data, flags) => {
        let json;

        try {
            json = JSON.parse(data);
        } catch (err) {
            console.error(err);
        }

        switch(json.request) {
            case 'move':
                if (ws === ws1) {
                    player1.speedX = json.speedX;
                    player1.speedY = json.speedY;
                } else if (ws === ws2) {
                    player2.speedX = json.speedX;
                    player2.speedY = json.speedY;
                }

                // updateGame();
                break;
        }

        updateGame();
    });

    ws.on('close', () => {
        if (ws === ws1) {
            ws1 = undefined;
            myGame.stopGame();
        }

        if (ws === ws2) {
            ws2 = undefined;
            myGame.stopGame();
        }
    });
});

function broadcastMessage(msg) {
	wss.clients.forEach((curr) => {
		curr.send(JSON.stringify(msg));
	});
}

function broadcastGame() {
	broadcastMessage(myGame);
}

function playSound() {
	let chord = Math.floor(Math.random() * 14) + 1;

	broadcastMessage({response: 'sound', data: chord});
}


let player1;
let player2;
let ball;
let interval;

let myGame = {
    response: 'state',
    pieces: [],
    width: 480,
    height: 270,
    state: 'stopped',

    start : function() {
        this.state = 'start';
        this.pieces = [];
        this.width = 480;
        this.height = 270;

        interval = setInterval(updateGame, 20);
    },

    stopGame: function() {
        this.state = 'stopped';
        clearInterval(interval);
    }
};

function startGame() {
    myGame.start();

    player1 = new component(15, 85, "red", 10, 97, 'player1', (curr) => {
        if (curr.y <= 0) {
            curr.y = 0;
        }

        if (curr.x <= 0) {
            curr.x = 0;
        }

        if (curr.y >= (myGame.height - curr.height)) {
            curr.y = (myGame.height - curr.height);
        }

        if (curr.x >= (myGame.width - curr.width)) {
            curr.x = (myGame.width - curr.width);
        }
    });

    player2 = new component(15, 85, "Blue", myGame.width - 25,  97, 'player2', (curr) => {
        if (curr.y <= 0) {
            curr.y = 0;
        }

        if (curr.x <= 0) {
            curr.x = 0;
        }

        if (curr.y >= (myGame.height - curr.height)) {
            curr.y = (myGame.height - curr.height);
        }

        if (curr.x >= (myGame.width - curr.width)) {
            curr.x = (myGame.width - curr.width);
        }
    });

    player1.speedYSize = 3;
    player2.speedYSize = 3;

    myGame.pieces.push(player1);
    myGame.pieces.push(player2);

    ball = new component(10, 10, "black", 235, 130, 'ball', (curr) => {
        if (curr.x <= 0) {
            clearInterval(interval);
            myGame.state = 'done 1';

            return;
        }

        if (curr.x >= myGame.width) {
            clearInterval(interval);
            myGame.state = 'done 2';

            return;
        }

        if (curr.y <= 0 || curr.y >= (myGame.height - curr.height)) {
            curr.changeY();
        }

        if (curr.x <= player1.x + player1.width) {
            // if ((curr.y <= player1.y + player1.height && curr.y + curr.height > player1.y)
            //     || (curr.y + curr.height >= player1.y && curr.y + curr.height < player1.y + player1.height)) {
            //     curr.changeY();
            // }

            if (curr.y < player1.y + player1.height && curr.height + curr.y > player1.y) {
                curr.changeX();
            }
        }

        if (curr.x + curr.width >= player2.x) {
            // if ((curr.y <= player2.y + player2.height && curr.y + curr.height > player2.y)
            //     || (curr.y + curr.height >= player2.y && curr.y + curr.height < player2.y + player2.height)) {
            //     curr.changeY();
            // }

            if (curr.y < player2.y + player2.height && curr.height + curr.y > player2.y) {
                curr.changeX();
            }
        }
    });
    ball.speedXSize = 1;
    ball.speedX = -1;
    ball.speedYSize = 1;
    ball.speedY = 1;

    myGame.pieces.push(ball);
}

function component(width, height, color, x, y, name, collision) {
    this.width = width;
    this.height = height;
    this.speedX = 0;
    this.speedXSize = 0;
    this.speedY = 0;
    this.speedYSize = 0;
    this.collision = collision;
    this.x = x;
    this.y = y;
    this.color = color;
    this.name = name;

    this.newPos = function() {
        this.moveX();
        this.moveY();

        this.collision(this);
    };

    this.moveX = function() {
        this.x += this.speedX * this.speedXSize;
    };

    this.moveY = function() {
        this.y += this.speedY * this.speedYSize;
    };


    this.change = 0;

    this.changeX = function() {
        this.speedX *= -1;
        this.moveX();

        if (++this.change % 5 == 0) {
	        this.speedXSize++;
	        this.speedYSize++;
        }

	    playSound();
    };

    this.changeY = function() {
        this.speedY *= -1;
        this.moveY();

        if (++this.change % 5 == 0) {
	        this.speedXSize++;
	        this.speedYSize++;
        }

	    playSound();
    };
}

function updateGame() {

    if (myGame.pieces)
        myGame.pieces.forEach(function(p) {
            p.newPos();
        });

    broadcastGame();
}


app.use('/', express.static(path.join(__dirname, 'static')));

app.set('port', 3000);

// Listen for requests
let server = app.listen(app.get('port'), function() {
    let port = server.address().port;
    console.log('Magic happens on port ' + port);
});
