let scoresText = null,
    unsortedScores = [],
    sortedScores = [];
// "Response: {\"name\":\"Phil\",\"score\":10},{\"name\":\"Phil2\",\"score\":88},{\"name\":\"Phil3\",\"score\":69}"
// ^^ dummy response data for testing purposes...

window.onload = function() {
    processLeaderboard();
}

function processLeaderboard() {
    return new Promise(function(resolve, reject) {
        getScores().then(function(result) {
            responseToArray(result);
        }).then(function(result) {
            sortScores();
        }).then(function(result) {
            fillTop();
            resolve();
        });
    })
    
}

function getRank(name, score) { 
    // Returns the first instance of a players name + score combination
    // Repetitive rows wont matter because the first instance is what the players rank will be
    let i = 0;
    for (i; i < sortedScores.length; i++) {
        if (sortedScores[i].name == name && sortedScores[i].score == score) {
            break;
        }
    }
    return i + 1;
}

function getScores() {
    return new Promise(function(resolve, reject) {
        const url = "https://limitless-wildwood-12859.herokuapp.com/";
        let xhttp = new XMLHttpRequest();
        xhttp.open("GET", url + "?getScores=true", true);
        xhttp.send();
        xhttp.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
                scoresText = this.responseText;
                console.log(scoresText);
                resolve(this.responseText);
            }
        };
    })
}

function responseToArray(scoresText) {
    return new Promise(function(resolve, reject) {
        let str = scoresText.substring(scoresText.indexOf('{'), scoresText.lastIndexOf('}') + 1);
        str = str.replace(',{', '{');
        let arr = str.split('}');
        for (i = 0; i < arr.length; i++) {
            if (arr[i] !== "") {
                let tempstr = arr[i];
                tempstr = tempstr.replace("{\"name\":\"", "_");
                tempstr = tempstr.replace("\",\"", "+");
                tempstr = tempstr.replace("score\":", "=")
                let scoreRow = {
                    name: tempstr.substring(tempstr.indexOf("_") + 1, tempstr.lastIndexOf("+")),
                    score: parseInt(tempstr.substring(tempstr.lastIndexOf("=") + 1))
                }
                unsortedScores.push(scoreRow);
            }
        }
        resolve();
    })
    
}

function sortScores() {
    return new Promise(function(resolve, reject) {
        sortedScores = mergeSort(unsortedScores);
        resolve();
    })
}

function fillTop() {
    let numIDs = ['first', 'second', 'third', 'fourth', 'fifth'];
    for (i = 0; i < numIDs.length; i++) {
        if (sortedScores[i] !== null || sortedScores[i] !== undefined) {
            let queryName = "." + numIDs[i] + " .name",
                queryScore = "." + numIDs[i] + " .score";
            document.querySelector(queryName).innerHTML = sortedScores[i].name;
            document.querySelector(queryScore).innerHTML = sortedScores[i].score;
        }
    }
    document.getElementById(loadingGif2ID).style.display = "none";
}

function mergeSort(list){
    let half = list.length/2;
    if(list.length < 2){
      return list;
    }
    const left = list.splice(0,half);
    return merge(mergeSort(left),mergeSort(list));
}

function merge(left,right){
    let list = [];
    while(left.length && right.length){
      if(left[0].score > right [0].score){
        list.push(left.shift());
      }else{
        list.push(right.shift());
      }
    }
    return [...list, ...left, ...right];
}