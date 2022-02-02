const dbt = document.getElementById('debug');
const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');

var running = false;
var gamePaused = false;
var dropCounter = 0;
var dropInterval = 1000;
var lastTime = 0;
var speedModifier = 1;
var mode = 0;
/*
0: Normal-Mode
1: Fill-Mode
*/

context.scale(20, 20);

dbt.innerHTML = "Debug-Log";
window.onerror = function myErrorHandler(errorMsg, url, lineNumber) {
    dbt.innerHTML += "</br>" + errorMsg + " | " + lineNumber + " | " + url;
    return false;
}

function arenaSweep() {
    if (mode != 1) {
        var rowCount = 1;
        outer: for (var y = arena.length - 1; y > 0; --y) {
            for (var x = 0; x < arena[y].length; ++x) {
                if (arena[y][x] === 0) {
                    continue outer;
                }
            }

            var row = arena.splice(y, 1)[0].fill(0);
            arena.unshift(row);
            ++y;

            player.score += rowCount * 10;
            rowCount *= 2;
        }
    }
}

function collide(arena, player) {
    var m = player.matrix;
    var o = player.pos;
    for (var y = 0; y < m.length; ++y) {
        for (var x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 &&
                (arena[y + o.y] &&
                    arena[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

function createMatrix(w, h) {
    var matrix = [];
    while (h--) {
        matrix.push(new Array(w).fill(0));
    }
    return matrix;
}

function createPiece(type) {
    if (type === 'I') {
        return [
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0],
        ];
    } else if (type === 'L') {
        return [
            [0, 2, 0],
            [0, 2, 0],
            [0, 2, 2],
        ];
    } else if (type === 'J') {
        return [
            [0, 3, 0],
            [0, 3, 0],
            [3, 3, 0],
        ];
    } else if (type === 'O') {
        return [
            [4, 4],
            [4, 4],
        ];
    } else if (type === 'Z') {
        return [
            [5, 5, 0],
            [0, 5, 5],
            [0, 0, 0],
        ];
    } else if (type === 'S') {
        return [
            [0, 6, 6],
            [6, 6, 0],
            [0, 0, 0],
        ];
    } else if (type === 'T') {
        return [
            [0, 7, 0],
            [7, 7, 7],
            [0, 0, 0],
        ];
    }
}

function drawMatrix(matrix, offset) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                context.fillStyle = colors[value];
                context.fillRect(x + offset.x,
                    y + offset.y,
                    1, 1);
            }
        });
    });
}

function draw() {
    context.fillStyle = 'RGBA(0,0,0,0.4)';
    context.fillRect(0, 0, canvas.width, canvas.height);

    drawMatrix(arena, {
        x: 0,
        y: 0
    });
    drawMatrix(player.matrix, player.pos);
}

function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                arena[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}

function rotate(matrix, dir) {
    for (var y = 0; y < matrix.length; ++y) {
        for (var x = 0; x < y; ++x) {
            var temp = matrix[y][x];
            matrix[y][x] = matrix[x][y];
            matrix[x][y] = temp;
        }
    }

    if (dir > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }
}

function playerDrop(offset) {
    if (gamePaused == false || mode != 0) {
        player.pos.y += offset;
        if (collide(arena, player)) {
            player.pos.y--;
            merge(arena, player);
            playerReset();
            arenaSweep();
            updateScore();
        }
        dropCounter = 0;
    }
}

function playerMove(offset) {
    if (gamePaused == false || mode != 0) {
        player.pos.x += offset;
        if (collide(arena, player)) {
            player.pos.x -= offset;
        }
    }
}

function playerReset() {
    var pieces = 'TJLOSZI';
    player.matrix = createPiece(pieces[pieces.length * Math.random() | 0]);
    player.pos.y = 0;
    player.pos.x = (arena[0].length / 2 | 0) -
        (player.matrix[0].length / 2 | 0);
    if (collide(arena, player)) {
        arena.forEach(row => row.fill(0));
        player.score = 0;
        updateScore();
    }
}

function playerRotate(dir) {
    if (gamePaused == false || mode != 0) {
        var pos = player.pos.x;
        var offset = 1;
        rotate(player.matrix, dir);
        while (collide(arena, player)) {
            player.pos.x += offset;
            offset = -(offset + (offset > 0 ? 1 : -1));
            if (offset > player.matrix[0].length) {
                rotate(player.matrix, -dir);
                player.pos.x = pos;
                return;
            }
        }
    }
}

function update(time) {
    if (time == null || time == undefined) {
        time = 0;
    }
    if (mode == 0) {
        var deltaTime = time - lastTime;
        //console.log(dropInterval * speedModifier);
        dropCounter += deltaTime;
        if (dropCounter > (dropInterval * speedModifier)) {
            playerDrop(1);
        }
        lastTime = time;
    }
    draw();
    requestAnimationFrame(update);
}

function updateScore() {
    document.getElementById('score').innerText = player.score;
    if (player.score > 30 && player.score < 60) {
        speedModifier = 0.9;
    } else if (player.score > 60 && player.score < 90) {
        speedModifier = 0.8;
    } else if (player.score > 90 && player.score < 120) {
        speedModifier = 0.7;
    } else if (player.score > 120 && player.score < 150) {
        speedModifier = 0.6;
    } else if (player.score > 150 && player.score < 180) {
        speedModifier = 0.5;
    } else if (player.score > 180 && player.score < 210) {
        speedModifier = 0.4;
    } else if (player.score > 210 && player.score < 240) {
        speedModifier = 0.3;
    } else if (player.score > 240 && player.score < 270) {
        speedModifier = 0.2;
    } else if (player.score > 270 && player.score < 300) {
        speedModifier = 0.1;
    }
    //console.log(speedModifier + " " + player.score);
}

function switchMode() {
    if (mode == 0) {
        mode = 1;
        document.getElementById('gameMode').innerHTML = "Fill";
    } else {
        mode = 0;
        document.getElementById('gameMode').innerHTML = "Normal";
    }
}

function togglePause() {
    if (mode != 1) {
        if (gamePaused == true) {
            gamePaused = false;
            document.getElementById('gameState').innerHTML = "Playing";

        } else if (gamePaused == false) {
            gamePaused = true;
            document.getElementById('gameState').innerHTML = "Paused";
        }
    }
}

function move(dir, offset) {
    if (dir == "x") { //Vertical Movement
        playerMove(offset);
    } else if (dir == "y") { //horizontal Movement
        playerDrop(offset);
    } else if (dir == "z") { //Rotate
        playerRotate(offset);
    }
}

var colors = [
    null,
    '#FF0D72',
    '#0DC2FF',
    '#0DFF72',
    '#F538FF',
    '#FF8E0D',
    '#FFE138',
    '#3877FF',
];

const arena = createMatrix(12, 20);

const player = {
    pos: {
        x: 0,
        y: 0
    },
    matrix: null,
    score: 0,
};
