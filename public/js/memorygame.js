// R = NUMBER OF ROWS
// T = NUMBER OF TILES PER ROW
const MAX_LEN = 7, // Max number of rows/columns
      MIN_LEN = 2, // Min number of rows/columns
      START_R = 3, // Initial number of rows
      START_T = 3, // Initial number of columns
      MAX_SOLVE_MULT = 0.75; // Multiplier used to determine the maximum number of solvable tiles per grid
                             // Multiply by smaller number to get the maximum.

let GAME_RUNNING = false, // Boolean to check if the game has started.
    GAME_RDY = false, // Boolean to check whether or not the game is ready for play between rounds
    ROW_ID = 0, // Can be interpreted as the row count; Used to give rows their ID
    score = 0, // Player score
    curr_R = 3, // Current number of rows
    curr_T = 3, // Current number of tiles per row
    curr_rot = 1, // Current rotation position of the board
    GAME_ARR = [], // Holds rows as arrays and tile id's as objects of the array
    GAME = {
        sol: 4, // Number of tiles selected to solve
        sel: 0, // Number of tiles the player has pressed (must equal the above by the end)
        err: 0, // Number of errors the player has made
        toSolve_arr: [],      // Stores the id's of the tiles to solve
        clicked_arr: [],      // Stores the id's of the correctly clicked tiles 
        incorrect_arr: [],    // Stores the id's of the incorrectly clicked tiles
        currTile: 0,          // Index (in toSolve_arr) of the next tile to click in order
        outOfOrderPressed_arr: []      // Array to store the indices of tiles clicked out of order  
    },
    timeoutID = 0,  // variable to store the latest timeout ID, used to clear timeout functions
    goodToRotate = false, // Boolean to check whether the rotateBoard() function should be called or not
    audioArray = [], // Array to hold all Audio objects
    audioLoaded = false, // Boolean to check if the audio has already been loaded or not
    hardMode = false, // If set to true, then hard mode enabled -> The order of your clicks matter
    currOrderRot = "rotate(0deg)", // Variable string to store the current rotation of the tile order div
    scoreSubmitted = false; // Variable to check whether the user submitted their score or not yet

function startGame(hm) {
    if (document.getElementById(gameboardID) == null) {
        gb = document.createElement("div");
        gb.id = gameboardID;
        document.getElementById(gameContID).prepend(gb);
    }
    currOrderRot = "rotate(0deg)";
    hardMode = hm;
    document.getElementById(gameboardID).style.display = "flex";
    document.getElementById(gameStartID).style.display = "none";
    initDraw();
    newRoundHandler();
    GAME_RUNNING = true;
    loadAudio();
}

function loadAudio() {
    if (!audioLoaded) {
        let correctSFX = new Audio(correctSFXPath),
        wrongSFX = new Audio(wrongSFXPath),
        endRoundSFX1 = new Audio(endRoundSFXPath1),
        endRoundSFX2 = new Audio(endRoundSFXPath2),
        endGameSFX = new Audio(endGameSFXPath);
        audioArray.push(correctSFX, wrongSFX, endRoundSFX1, endRoundSFX2, endGameSFX);
        audioLoaded = true;
    }
}

function initDraw() {
    let gameBoard = document.getElementById(gameboardID);
    for (let i = 0; i < START_R; i++) {
        let row = document.createElement("div"), TILE_ID = 0;
        row.id = "row_" + ROW_ID;
        row.className = rowClassName;
        let row_arr = []
        for (let j = 0; j < START_T; j++) {
            let tile_id = "tile_" + ROW_ID + "_" + TILE_ID,
                tile = createTile(tile_id);
            TILE_ID++;
            row.appendChild(tile);
            row_arr[j] = tile_id;
        }
        GAME_ARR[i] = row_arr;
        ROW_ID++;
        gameBoard.appendChild(row);
    }
}

function createTile(tile_id) {
    let tile = document.createElement("div");
    tile.id = tile_id;
    tile.className = tileClassName;
    tile.style.transform = noRotNoScale;
    tile.addEventListener("click", function() { tilePressed(tile_id) });
    return tile;
}

function showTiles() {
    let tiles = document.getElementsByClassName(tileClassName)
    for (i = 0; i < tiles.length; i++) {
        tiles[i].style.transform = fullRotFullScale;
    }
    selectTilesToSolve();
}
function hideTiles() {
    let tiles = document.getElementsByClassName(tileClassName)
    for (i = 0; i < tiles.length; i++) {
        tiles[i].style.backgroundColor = tileHiddenColour;
        tiles[i].style.transform = noRotNoScale;
    }
}

function ready() {
    document.getElementById(gameReadyButtonID).style.transform = "scale(0)";
    timeoutID = setTimeout(function() {
        document.getElementById(gameReadyID).style.display = "none";
        showTiles();
    }, 550);
}

function selectTilesToSolve() {
    let high_X = (curr_T >= curr_R) ? curr_T : curr_R
    if (GAME.sol < high_X || GAME.sol > Math.floor((MAX_SOLVE_MULT * (curr_R * curr_T)))) {
        GAME.sol = high_X;
    }
    document.getElementById(ttsID).innerHTML = "Tiles to Solve: " + GAME.sol;
    for (i = 0; i < GAME.sol; i++) {
        let tile_id = 0;
        while (!GAME.toSolve_arr.includes(tile_id)) {
            let r_rowID = Math.floor(Math.random() * curr_R),
                r_tilID = Math.floor(Math.random() * curr_T);
            temp_tile_id = "tile_" + r_rowID + "_" + r_tilID;
            if (!GAME.toSolve_arr.includes(temp_tile_id)) {
                tile_id = temp_tile_id;
                GAME.toSolve_arr[i] = tile_id
                if (hardMode) {
                    let orderNum = i + 1,
                        tileOrder = document.createElement("div");
                    tileOrder.id = tile_id + "_order";
                    tileOrder.className = tileOrderClassName;
                    tileOrder.innerHTML = orderNum;
                    tileOrder.style.transform = currOrderRot;
                    document.getElementById(tile_id).appendChild(tileOrder);
                }
            }
        }
    }
    timeoutID = setTimeout(() => {
        showSelected(true)
    }, 1300);
}

function showSelected(rotate) {
    let tileOrders = document.getElementsByClassName(tileOrderClassName);
    for (i = 0; i < GAME.toSolve_arr.length; i++) {
        let tile = document.getElementById(GAME.toSolve_arr[i]);
        tile.style.backgroundColor = tileSelectColour;
        if (hardMode) {
            tileOrders[i].style.display = "flex";
        }
    }
    timeoutID = setTimeout(() => {
        hideSelected(rotate);
    }, 1750);
}

function hideSelected(rotate) {
    let tileOrders = document.getElementsByClassName(tileOrderClassName);
    for (i = 0; i < GAME.toSolve_arr.length; i++) {
        let tile = document.getElementById(GAME.toSolve_arr[i]);
        tile.style.backgroundColor = tileHiddenColour;
        if (hardMode) {
            tileOrders[i].style.display = "none";
        }
    }
    if (rotate) {
        timeoutID = setTimeout(() => {
            rotateBoard();
        }, 500);
    }
}

function rotateBoard() {
    let gameboard = document.getElementById(gameboardID),
        tileOrders = document.getElementsByClassName(tileOrderClassName);
    if (gameboard != null) {
        if (curr_rot == 1) {
            gameboard.style.transform = "rotate(90deg)";
            currOrderRot = "rotate(-90deg)";
        } else if (curr_rot == 3) {
            gameboard.style.transform = "rotate(-90deg)";
            currOrderRot = "rotate(90deg)";
        } else if (curr_rot == 2 || curr_rot == 4) {
            gameboard.style.transform = "rotate(0deg)";
            currOrderRot = "rotate(0deg)";
        } 
        for (i = 0; i < tileOrders.length; i++) {
            tileOrders[i].style.transform = currOrderRot;
        }
        curr_rot++;
        if (curr_rot == 5) {
            curr_rot = 1;
        }
        GAME_RDY = true;
    }
}

function tilePressed(tile_id) {
    if (GAME_RDY) {
        if (!GAME.clicked_arr.includes(tile_id) && !GAME.incorrect_arr.includes(tile_id)) { // Check if this tile has already been clicked or not
            if (GAME.toSolve_arr.includes(tile_id)) { // CORRECT TILE CLICKED
                if (hardMode) {
                    orderCheck(tile_id);
                } else {
                    correctClick(tile_id)
                }
            } else { // INCORRECT TILE CLICKED
                incorrectClick(tile_id);
            }
            GAME.sel += 1;
        }
        roundCheck();
    }
}

function roundCheck() {
    let numLeft = GAME.sol - GAME.sel;
    document.getElementById(ttsID).innerHTML = "Tiles to Solve: " + numLeft;

    if (GAME.sel == GAME.sol) { // END ROUND
        GAME_RDY = false;
        playSound(2);
        displayMessage().then(function() {
            hideMessage();
            timeoutID = setTimeout(() => {
                endRoundHandler();
            }, 250);
        });
    }
}

function correctClick(tile_id) {
    document.getElementById(tile_id).style.backgroundColor = tileSelectColour;
    if (hardMode) {
        document.getElementById(tile_id + "_order").style.display = "flex";
    }
    GAME.clicked_arr.push(tile_id);
    playSound(0);
    updateScore(1);
}

function incorrectClick(tile_id) {
    document.getElementById(tile_id).style.backgroundColor = tileWrongColour;
    GAME.err += 1;
    if (hardMode && GAME.toSolve_arr.includes(tile_id)) {
        document.getElementById(tile_id + "_order").style.display = "flex";
        GAME.outOfOrderPressed_arr.push(GAME.toSolve_arr.indexOf(tile_id));
    }
    GAME.incorrect_arr.push(tile_id);
    playSound(1);
    updateScore(-1);
}

function orderCheck(tile_id) {
    let orderPressed = GAME.toSolve_arr.indexOf(tile_id);
    while(GAME.outOfOrderPressed_arr.includes(GAME.currTile)) { // Check to see if the current tile was already clicked 
        GAME.currTile++;
    }
    if (orderPressed == GAME.currTile) {
        GAME.currTile++;
        correctClick(tile_id);
    } else {
        incorrectClick(tile_id);
    }
}

function updateScore(upd) {
    score += upd;
    document.getElementById(scoreID).innerHTML = "Score: " + score;
}

function displayMessage() {
    return new Promise(function(resolve, reject) {
        let sp = (GAME.sol - GAME.err) / GAME.sol,
            disp_div = document.getElementById(gameEndRoundDispID),
            disp_msg = document.getElementById(gameEndRoundMsgID),
            message = "";
        disp_div.style.display = "flex";
        if (sp == 1) {
            message = perfMSG;
        } else if (sp >= 0.75 && sp < 1) {
            message = niceMSG;
        } else if (sp >= 0.5 && sp < 0.75) {
            message = okayMSG;
        } else if (sp >= 0.01 && sp < 0.5) {
            message = badMSG;
        } else {
            message = failMSG;
        }
        disp_msg.innerHTML = message;
        showSelected(false);
        timeoutID = setTimeout(function() {
            disp_msg.style.transform = "scale(2)";
            timeoutID = setTimeout(function() {
                disp_msg.style.transform = "scale(0)";
                timeoutID = setTimeout(function() { resolve(); }, 800);
            }, 1000);
        }, 500);
    });
}
function hideMessage() {
    document.getElementById(gameEndRoundDispID).style.display = "none";
}

function removeTileOrders() {
    let tileOrders = document.getElementsByClassName(tileOrderClassName);
    for (i = tileOrders.length - 1; i >= 0; i--) {
        console.log(tileOrders[i]);
        tileOrders[i].remove();
    }
    GAME.currTile = 0;
}


function endRoundHandler() {
    if (hardMode) {
        removeTileOrders();
    }
    if (GAME.err == GAME.sol) {
        updateScore(-5);
    }else if (((GAME.sol - GAME.err) / GAME.sol) < 0.5) { 
        updateScore(-3);
    } else if (GAME.err == 0) {
        updateScore(5);
    }
    if (score <= 0) {
        terminate();
    } else {
        hideTiles();
        timeoutID = setTimeout(function() {
            if (GAME.err > 0) {
                decDifficulty();
            } else {
                incDifficulty();
            }
            timeoutID = setTimeout(function() {
                if (score > 0 && GAME_RUNNING) {
                    newRoundHandler();
                }
                GAME.sel = 0;
                GAME.err = 0;
                GAME.toSolve_arr = [];
                GAME.clicked_arr = [];
                GAME.incorrect_arr = [];
                GAME.outOfOrderPressed_arr = [];
            }, 250)
        }, 800)
    }
}

function newRoundHandler() {
    document.getElementById(gameReadyID).style.display = "flex";
    timeoutID = setTimeout(function() {
        document.getElementById(gameReadyButtonID).style.transform = "scale(1)";
    }, 200)
}

function incDifficulty() {
    let gameBoard = document.getElementById(gameboardID),
        incSize = (Math.random() <= 0.65) ? true : false; // if true increase matrix size, if false increase num to solve

    if (GAME.sol >= Math.floor((MAX_SOLVE_MULT * (curr_T * curr_R))) && curr_R == MAX_LEN && curr_T == MAX_LEN) { // All limits reached
        incSize = null;
    } else if (!incSize && GAME.sol >= Math.floor((MAX_SOLVE_MULT * (curr_T * curr_R)))) { // Num to Solve limit reached
        incSize = true; 
    } else if (incSize && curr_R == MAX_LEN && curr_T == MAX_LEN) { // Num rows to add limit reached
        incSize = false;
    }
    if (incSize) { 
        if (curr_R <= curr_T) { // If num rows less or equal to num tiles, add a row
            let row = document.createElement("div"), TILE_ID = 0;
            row.id = "row_" + ROW_ID;
            row.className = rowClassName;
            let row_arr = []
            for (let j = 0; j < curr_T; j++) {
                let tile_id = "tile_" + ROW_ID + "_" + TILE_ID,
                    tile = createTile(tile_id);
                TILE_ID++;
                row.appendChild(tile);
                row_arr[j] = tile_id;
            }
            GAME_ARR.push(row_arr);
            ROW_ID++;
            modHeight(1);
            gameBoard.appendChild(row);
            curr_R += 1;
        } else { // add tiles to all rows
            for (let j = 0; j < ROW_ID; j++) {
                let row_id = "row_" + j,
                    row = document.getElementById(row_id),
                    tile_id = "tile_" + j + "_" + curr_T,
                    tile = createTile(tile_id);
                row.appendChild(tile);
                GAME_ARR[j][curr_T] = tile_id;
            }
            modWidth(1);
            curr_T += 1;
        }
    } else { // Increase num to solve
        GAME.sol++;
    }
}

function decDifficulty() {
    let high_X = (curr_T >= curr_R) ? curr_T : curr_R,
        decSize = (Math.random() >= 0.5) ? true : false; // if true increase matrix size, if false increase num to solve
    
    if (GAME.sol == 2 && curr_R == MIN_LEN && curr_T == MIN_LEN) { // All minimums reached
        decSize = null;
    } else if (!decSize && (GAME.sol == 2 || GAME.sol == high_X)) { // Num to Solve min reached
        decSize = true; 
    } else if (decSize && curr_R == MIN_LEN && curr_T == MIN_LEN) { // Num rows to remove limit reached
        decSize = false;
    }
    if (decSize && (curr_R > MIN_LEN || curr_T > MIN_LEN)) {
        if (curr_R >= curr_T) { // Remove a row
            ROW_ID--;
            curr_R--;
            document.getElementById("row_" + ROW_ID).remove();
            GAME_ARR.pop();
            modHeight(-1);
            
        } else { // Remove a tile from each row
            curr_T--;
            for(i = 0; i < curr_R; i++) {
                document.getElementById("tile_" + i + "_" + curr_T).remove();
                GAME_ARR[i].pop();
            }
            modWidth(-1);
        }
    } else { // decrease num to solve
        GAME.sol--;
    }
}

function modHeight(add_or_sub) {
    // add_or_sub must be an int 1 or -1
    let gameBoard = document.getElementById(gameboardID),
        h = gameBoard.clientHeight;
    h += (16 * (curr_R + 1)) * add_or_sub;
    gameBoard.style.height = h + "px";
}
function modWidth(add_or_sub) {
    // add_or_sub must be an int 1 or -1
    let gameBoard = document.getElementById(gameboardID),
        w = gameBoard.clientWidth;
    w += (16 * (curr_T + 1)) * add_or_sub;
    gameBoard.style.width = w + "px";
}

function terminate() {
    if (GAME_RUNNING) {
        let confirmTerminate = false;
        if (score > 0) { 
            confirmTerminate = confirm("Are you sure you wish to end the game?");
        } else if (score <= 0) {
            confirmTerminate = true;
        }
        if (confirmTerminate) {
            GAME_RUNNING = false;
            document.getElementById(gameEndMenuID).style.display = "flex";
            document.getElementById(finalScoreID).innerHTML = "Score: " + score;
            playSound(4);
            stopSounds(4);
            resetBoard();
            while (timeoutID--) {
                clearTimeout(timeoutID);
            }
            clearMidGameMenus();
        }
    }
}

function resetBoard() {
    let gameBoard = document.getElementById(gameboardID);
    ROW_ID--;
    for (ROW_ID; ROW_ID >= 0; ROW_ID--) {
        document.getElementById("row_" + ROW_ID).remove();
    }
    gameBoard.remove();
}

function clearMidGameMenus() {
    document.getElementById(gameReadyButtonID).style.transform = "scale(0)";
    setTimeout(function() {
        document.getElementById(gameReadyID).style.display = "none";
    }, 550);
}

function replay() {
    if (scoreSubmissionCheck()) {
        document.getElementById(gameEndMenuID).style.display = "none";
        document.getElementById(scoreSubmittedMenuID).style.display = "none";
        resetVariables();
        scoreSubmitted = false;
        startGame(hardMode);
    }
}

function endSession() {
    if(scoreSubmissionCheck()) {
        clearMidGameMenus();
        document.getElementById(gameEndMenuID).style.display = "none";
        document.getElementById(scoreSubmittedMenuID).style.display = "none";
        document.getElementById(gameStartID).style.display = "flex";
        resetVariables()
        scoreSubmitted = false;
    }
}

function scoreSubmissionCheck() {
    if(!scoreSubmitted) {
        return confirm("You havent submitted your score yet, are you sure you wish to end the game?")
    } else {
        return true;
    }
}

function resetVariables() {
    GAME_RDY = false;
    ROW_ID = 0;
    curr_R = 3;
    curr_T = 3;
    score = 0;
    curr_rot = 1;
    GAME_ARR = [];
    GAME.sol = 4;
    GAME.sel = 0;
    GAME.err = 0;
    GAME.toSolve_arr = [];
    GAME.clicked_arr = [];
    GAME.incorrect_arr = [];
    GAME.outOfOrderPressed_arr = [];
    GAME.currTile = 0;
    document.getElementById(scoreID).innerHTML = "Score: " + 0;
}


function playSound(index) {
    if (index == 2 || index == 3) {
        index = (Math.random() <= 0.5) ? 2 : 3;
    }
    audioArray[index].currentTime = 0;
    audioArray[index].play();
}

function stopSounds(except) {
    if (except != null) {
        for (i = 0; i < audioArray.length; i++) {
            if (i != except) {
                audioArray[i].pause();
            }
        }
    }
}

function submitScore() {
    const url = "https://limitless-wildwood-12859.herokuapp.com/";
    let inputText = document.getElementById("submit-name-input");
    let name = inputText.value;
    let promise = new Promise(function(resolve, reject) {
        if ((name !== "" && name !== undefined) && name.length < 25) {
            let xhttp = new XMLHttpRequest();
            xhttp.open("GET", url + "/?getScores=false&name=" + name + "&score=" + score, true);
            xhttp.send();
            xhttp.onreadystatechange = function () {
                if (this.readyState == 4 && this.status == 200) {
                    console.log(this.responseText);
                    resolve();
                }
            }
        } else if (name.length >= 25) {
            alert("Name must be less than 25 characters!");
            reject();
        } else {
            alert("Please enter your name before submitting!");
            reject();
        }
    });
    promise.then(() => {
        scoreSubmitted = true;
        document.getElementById(gameEndMenuID).style.display = "none";
        document.getElementById(scoreSubmittedMenuID).style.display = "flex";
        document.getElementById(loadingGifID).style.display = "block";
        let leaderboardOld = document.getElementById(leaderboardTableSubmitID);
        if (leaderboardOld !== null) {
            leaderboardOld.remove();
        }
        processLeaderboard().then(() => {
            document.querySelector('#' + psSubID + ' .rank').innerHTML = getRank(name, score);
            document.querySelector('#' + psSubID + ' .name').innerHTML = name;
            document.querySelector('#' + psSubID + ' .score').innerHTML = score;
            getLeaderboardTable();
        })
    });
}

function getLeaderboardTable() {
    let leaderboardClone = document.getElementById(leaderboardTableID).cloneNode(true);
    leaderboardClone.id = leaderboardTableSubmitID;
    document.getElementById(ldbtSubmitContainerID).appendChild(leaderboardClone);
    document.getElementById(loadingGifID).style.display = "none";
}
