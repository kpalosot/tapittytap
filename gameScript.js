/*

Name: Kyla Palos
CDF ID: g3palosk
Date handed in: 9th October, 2015

Note that links provided in the code either means that:
	- the logical thinking is based on the source site and
	code has been modified
	- the code is from that site

Also, note _MOST_ of those codes are somehow modified for this
assignment's purposes.

*/

/***********************************************************
*   Global variables
***********************************************************/
//graphics
var canvas;
var ctx;
var bgColour = "#e3e3e3";

//state
var lvl1 = true;
var pause = false;
var score = 0;
var countdownTimer, myReq, time;
var lvl1Speed = [0.06, 0.075, 0.15];
var finalSpeed = lvl1Speed;
var lvl2Speed = [0.08, 0.1, 0.2];
var seconds = 60;
var miss = 0;
var bugRotation = 0.005;

//food-related
var foods = [];
var foodR = 10;

//bugs
var allBugs = [];
var deadBugs = [];
// orange, red, black
var bugColour = ["#f96c02", "#bc191b", "#000000"];
var bugScore = [1, 3, 5];


var prevHighScore = 0;

/*
	Starting function
	I decided to separate these calls to make the structure of
	the game as modular as possible
*/

function start(){
    canvas = document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 630;
    canvas.id = "canvas";
    canvas.style.border = "#000000 1pt solid";
    document.body.appendChild(canvas);
    retrieveHighScore();
    gameMenu();
}

/***********************************************************
*   Starting Game Functions
***********************************************************/

/*
	This sets up the starting screen.
*/

function gameMenu(){
    ctx = canvas.getContext("2d");
    createBackground(ctx);
    ctx.fillStyle = "#000000";
    ctx.save();
    ctx.font = "bolder 30px Arial";
    ctx.fillText("Tap Tap Bug", 110, 200);
    ctx.restore();
    ctx.font = "15px Arial";
    var text = "High Score: " + prevHighScore;
    ctx.fillText(text, 150,235);

    radioHead(ctx);
    startButton(ctx);

    canvas.addEventListener("mousedown",
        difficultyPosition, false);
}

/*
	This handles the event when the user clicks on the buttons to choose
	the level of play and the start button.
*/

function difficultyPosition(event){
    var x = event.x - canvas.offsetLeft;
    var y = event.y - canvas.offsetTop;

    //setting difficultyto lvl1
    // 140<x<150 && 275<y<285
    if((x <= 150) && (x >= 140) && (y <= 285) && (y >= 275)){
        lvl1 = true;
        finalSpeed = lvl1Speed;
        radioHead(ctx);
    } 
    //setting difficulty to lvl2
    // 240 < x < 250 && 275 < y < 285
    else if((x <= 250) && (x >= 240) && (y <= 285) && (y >= 275)){
        lvl1 = false;
        finalSpeed = lvl2Speed;
        radioHead(ctx);
    }
    //start game
    // 150<x<240 && 325<y<375
    else if((x <= 240) && (x >= 150) && (y <= 355) && (y >= 325)){
        canvas.removeEventListener("mousedown", difficultyPosition, false);
        gamePlay(ctx);
    }
}

/*
	This sets the value of the the global variable prevHighScore
	if there is any saved in storage.
*/

function retrieveHighScore(){
    var pScore = localStorage.getItem("HighScore");
    if(typeof pScore !== "undefined" && pScore !== null){
        prevHighScore = Number(pScore);
    }
}

/***********************************************************
*   Starting Game Graphics
*
*	I decided to separate the graphics as much as possible
*	from the functionalities to make sure that it will be
*	easy to implement new changes if I needed to.
***********************************************************/

function radioHead(ctx){
    ctx.fillStyle = "#000000";
    ctx.font="15px Arial";
    ctx.fillText("Level 1:", 120, 270);
    ctx.fillText("Level 2:", 220, 270);
    if (lvl1){
        ctx.fillRect(140, 275, 10, 10);
        ctx.clearRect(240, 275, 10, 10);
        ctx.strokeRect(240, 275, 10, 10);

    } else {
        ctx.fillRect(240, 275, 10, 10);
        ctx.clearRect(140, 275, 10, 10);
        ctx.strokeRect(140, 275, 10, 10);
    }
}

function startButton(ctx){
    ctx.fillStyle="#5a5a5a";
    ctx.fillRect(150, 325, 90, 30);
    ctx.font = "15px Arial";
    ctx.fillStyle = "#f0f0f0";
    ctx.fillText("Start game!", 155, 345);
}

/***********************************************************
*   Game Play Functions
***********************************************************/

/*
	This setups the game play. having this separated from
 	other functionalities such as my timer function makes it
	possible to make my code modular and be recalled to this
	state
*/
function gamePlay(ctx){
    createBackground(ctx);
    createPauseButton(ctx);
    countdownTimer = setInterval("timer()", 1000);
    foodGenerator(ctx);
    scoreDisplay();
    ctx.save();
    myReq = requestAnimationFrame(bugAnimation);

    canvas.addEventListener("mousedown",
        getPosition, false);
}

/*
	I made my timer such that it updates the time display.
	Also, it calls the bugDraw function every second.
	bugDraw is explained further down.
*/

function timer(){
    var text = "Time left: " + seconds;
    timeDisplay(ctx, text);

    if(seconds == 0){
        clearInterval(countdownTimer);
        window.cancelAnimationFrame(myReq);
        if(lvl1 == true){
            reinit();
            gamePlay(ctx);
        } else {
            endGame();
        }
    } else {
        seconds--;
        bugDraw(ctx);
    }
}

/*
	This detects the user's mousedown event which has two possibilities:
		- pause the game and
		- kill the bugs
	This event is removed if the player chooses to pause the game. More
	explanation is available at replay function.
	bugEradicator is further explaned later in the code.
*/
function getPosition(event){
    var x = event.x - canvas.offsetLeft;
    var y = event.y - canvas.offsetTop;

    //Pausing game
    if((x <= 205) && (x >= 190) && (y >= 5) && (y <= 25)){
        ctx.clearRect(190, 5, 25, 20);
            createPlayButton(ctx);
            clearInterval(countdownTimer);
            window.cancelAnimationFrame(myReq);
            myReq = undefined;
            time = 0;
            canvas.removeEventListener("mousedown",getPosition,false);
            canvas.addEventListener("mousedown", replay, false);
    }
    // clicking on bugs
    else if((x <= 400) && (x >= 0) && (y >= 30) && (y <= 630)){
        bugEradicator(x,y);
    }
}

/*
	This event detects the player's decision to resume the game.
	This is separated from getPosition because getPostion also
	handles the detection of the bug kills. If that event is not
	removed from the canvas, the player will have the option to
	click on the bugs and gain score when paused.


	Also, this is event is removed after the player clicks on the
	play button.
*/

function replay(event){
    var x = event.x - canvas.offsetLeft;
    var y = event.y - canvas.offsetTop;

    if((x <= 205) && (x >= 190) && (y >= 5) && (y <= 25)){
        ctx.clearRect(190, 5, 25, 20);
        createPauseButton(ctx);
        countdownTimer = setInterval("timer()", 1000);
        myReq = requestAnimationFrame(bugAnimation);
        canvas.removeEventListener("mousedown", replay, false);
        canvas.addEventListener("mousedown", getPosition, false);
    }
}

/***********************************************************
* Game play graphics function
*
* Separated from other functions with the same reason
* stated in Starting Game Graphics
***********************************************************/

function createBackground(ctx){
    ctx.clearRect(0, 30, 400, 600);
    ctx.fillStyle = bgColour;
    ctx.fillRect(0, 30, 400, 600);
}

function createPlayButton(ctx){

    var pButton = new Path2D();

    pButton.moveTo(190,5);
    pButton.lineTo(205,15);
    pButton.lineTo(190,25);

    ctx.fillStyle="#000000";
    ctx.fill(pButton);
    pause = false;
}

function createPauseButton(ctx){
    ctx.fillStyle="#000000";
    ctx.fillRect(190, 5, 5, 20);
    ctx.fillRect(200,5,5,20);
    pause=true;
}

function scoreDisplay(){
    var text = "Score: " + score;
    ctx.clearRect(300, 5, 100, 25);
    ctx.fillStyle = "#000000";
    ctx.font = "15px Arial";
    ctx.fillText(text, 300, 25);
}

function timeDisplay(ctx, text){
    ctx.clearRect(10, 5, 100, 25);
    ctx.fillStyle = "#000000";
    ctx.font = "15px Arial";
    var t = text;
    ctx.fillText(t, 10, 25);
}

function highScoreDisplay(){
    var text = "Highest score: " + score;
    ctx.clearRect(300, 5, 100, 25);
    ctx.fillStyle = "#000000";
    ctx.font = "15px Arial";
    ctx.fillText(text, 130, 235);
}

/***********************************************************
*   End game functions
***********************************************************/

/*
	This handles the end state of the game. It allows the
	user to replay the previous level or to go back to the
	main menu. It also displays the score of the player and
	notifies the player if a new high score is achieved.
 	Also, if a new high score is retrieved, then it is saved
	to the local storage.
*/

function endGame(){
    ctx.save();
    myReq = undefined;
    createBackground(ctx);
    scoreDisplay(score);
    restartButton();
    exitButton();
    reinit();
    ctx.restore();
    
    ctx.clearRect(190, 5, 25, 20);
    ctx.clearRect(10, 5, 100, 25);

    ctx.fillStyle="#000000";
    ctx.font = "bolder 20px Arial";
    ctx.fillText("Thank you for playing!", 100, 200);
    ctx.restore();
    ctx.font = "15x Arial";
    var text = "Your score: " + score;
    ctx.fillText(text, 100, 250);

    if(prevHighScore < score){
        localStorage.removeItem("HighScore");
        localStorage.setItem("HighScore", newScore);
        ctx.fillText("New high score!", 100, 270);
    }
    
    canvas.addEventListener("mousedown",
        gameDecision, false);

    var newScore = "" + score;

    if(prevHighScore < score){
        localStorage.removeItem("HighScore");
        localStorage.setItem("HighScore", newScore);
    }
}


/*
	Detects the player's option to replay or exit the game
*/
function gameDecision(event){
    var x = event.x - canvas.offsetLeft;
    var y = event.y - canvas.offsetTop;

    // restart button
    if((x <= 190) && (x >= 70) && (y <= 385) && (y >= 355)){
        canvas.removeEventListener("mousedown", gameDecision, false);
        reinit();
        score = 0;
        gamePlay(ctx);
    }
    // exit button
    else if((x <= 300) && (x >= 210) && (y <= 385) && (y >= 355)){
        location.reload();
    }
}


/*
	Reinitializes all global variables to its starting state
 	and also checks if the player is moving from lvl1 to lvl
 	2. This is to make sure that it sets the speeds right
 	and the score is not reset.
*/
function reinit(){
    lvl1 = true;
    pause = false;
    countdownTimer= 0;
    time = 0;
    seconds = 60;
    miss = 0;

    //food-related
    foods = [];
    foodR = 10;
    allBugs=[];

    if(lvl1 == true){
        lvl1 = false;
        finalSpeed = lvl2Speed;
    } else{
        score = 0;
        finalSpeed = lvl1Speed;
    }
}

/***********************************************************
*   End game graphics
*
* Separated from other functions with the same reason
* stated in Starting Game Graphics
***********************************************************/

function restartButton(){
    ctx.fillStyle="#5a5a5a";
    ctx.fillRect(70, 355, 120, 30);
    ctx.font = "15px Arial";
    ctx.fillStyle = "#f0f0f0";
    ctx.fillText("Restart Game", 80, 375);
}

function exitButton(){
    ctx.fillStyle="#5a5a5a";
    ctx.fillRect(210, 355, 90, 30);
    ctx.font = "15px Arial";
    ctx.fillStyle = "#f0f0f0";
    ctx.fillText("Exit", 240, 375);
}

/***********************************************************
*   Food functions
***********************************************************/

/*
	Generates a random x and y values for the food's
	location. While loop checks if the generated x,y
	coords will overlap on another food, then
	regenerate x,y. Then it calls foodDraw at the end.
	foodDraw is further explained later in the code.
*/
function foodGenerator(ctx){
    //x:(10,390) y:(160,620)
    var z = 0;
    for(var i = 0; i < 5; i++){
        var x = getRandomIntInclusive(20, 380);
        var y = getRandomIntInclusive(160, 610);
        var h = 0;
        while(inFoods(x,y)){
            x = getRandomIntInclusive(0,380);
            y = getRandomIntInclusive(160, 610);
        }
        foodDraw(ctx, x, y);
    }
}

/*
	Draws the food on the canvas with x,y coordinates
*/
function foodGraph(ctx, x, y){
    ctx.beginPath();
    ctx.arc(x,y,10,0,2*Math.PI, false);
    ctx.arc(x,y,4,0,2*Math.PI, true);
    ctx.fillStyle="#6fdaf1";
    ctx.fill();
}

/*
	Stores the x,y at an object 
*/
function foodInfo(x, y){
    this.left = x - foodR;
    this.right = x + foodR;
    this.top = y - foodR;
    this.bottom = y + foodR;
    this.x = x;
    this.y = y;
}

/*
	Calls foodGraph to draw the donut. Then it creates a new
	object with the x,y coordinates and pushes it to
	a global variable array.
*/
function foodDraw(ctx, x, y){
    foodGraph(ctx, x, y);
    var donut = new foodInfo(x, y);
    foods.push(donut);
}

/*
	Loops over all foods. If the x,y overlaps with any of
	the return true. False, otherwise.
*/
function inFoods(x, y){
    for (var i = 0; i < foods.length; i++) {
        if (foodOverlap(x, y, foods[i])) return true;
    }
    return false;
}

/*
 source: http://stackoverflow.com/questions/21029371/
  why-doesnt-this-function-detect-overlapping-circles

  Modified for this assignment's purpose

  Given two points, return true if the two points are
  are within 40px of each other. False, otherwise.
*/
function foodOverlap(x, y, mainDonut) {
    var distanceCenter = distanceCalc(x, y, mainDonut);
    // originally *2 but changed to *4 to make sure that donuts
    // are not side by side
    var collisionDistance = foodR * 4;
    return distanceCenter <= collisionDistance;
}

/*
	Calls foodGraph an all foods
*/
function foodRedraw(ctx){
    for(var i = 0; i < foods.length; i++){
        foodGraph(ctx, foods[i].x, foods[i].y);
    }
}

/*
	Removes the donut graphics
*/
function clearFood(donut){
    ctx.clearRect(donut.left, donut.top, 20, 20);
    ctx.fillStyle = bgColour;
    ctx.fillRect(donut.left, donut.top, 20, 20);
}

/***********************************************************
*   Bug functions
***********************************************************/

/*
 source: http://stackoverflow.com/questions/8877249
           /generate-random-integers-with-probabilities

 Modified for this assignment's purpose
 Returns the index for bugColour
*/
function bugColourRand(){
    var probability = [0, 0, 0, 0, 1, 1, 1, 2, 2, 2];
    var i = Math.floor(Math.random() * probability.length);
    return probability[i];
}

/*returns true if game has to spawn a bug at that second*/
function bugTimeRand(){
    var p = Math.random();
    // p > 0.5; spawn at current second
    if ((p > 0.5) || (miss == 1)){
        miss = 0;
        return true;
    } else { //p < 0.5, do not spawn; add 0.5 to miss.
        miss += 0.5;
        return false;
    }
}

/*returns the x coordinate for the bug to spawn at*/
function bugSpawnRand(){
    //x = rand; y = 50
    // x:(5, 395)
    return getRandomIntInclusive(10, 395);
}

/*draws the bug at x,y coordinate with colour colour
and opacity opacity*/
function bugGraph(ctx, x, y, colour, opacity){
    //middle point x = 5, y = 20

    //head
    var left = (x - 5);
    var right = (x + 5);
    var up = (y - 20);
    var down = (y + 20)

    var p1y = (y + 12.5);
    var p2y = (y + 5);
    var transY = (y + 15);

    var h1y = (y - 2.5);
    var h2y = (y - 10);

    var legWidth = 2.5;
    var legHeight = 1.5;

    var legX1 = left + 0.5;
    var legX2 = x + 2.5;

    ctx.fillStyle = colour;

    var head = new Path2D(); 
    head.moveTo(x, transY);
    head.bezierCurveTo(left, p1y, left, p2y, x, y);
    head.bezierCurveTo(right, p2y, right, p1y,
        x, transY);

    //leftAntennae
    var leftAntennae1 = new Path2D();
    leftAntennae1.moveTo(left,down);
    leftAntennae1.lineTo(left, (y + 17.5));
    leftAntennae1.lineTo((x - 2.5), down);

    var leftAntennae2 = new Path2D();
    leftAntennae2.moveTo(left, (down - 0.5));
    leftAntennae2.lineTo((left + 0.5), down);
    leftAntennae2.lineTo((x + 0.5), (y + 10));
    leftAntennae2.lineTo(x, (y + 9.5));

    //rightAntennae
    var rightAntennae1 = new Path2D();
    rightAntennae1.moveTo(right, down);
    rightAntennae1.lineTo(right, (y + 17.5));
    rightAntennae1.lineTo((x + 2.5), down);

    var rightAntennae2 = new Path2D();
    rightAntennae2.moveTo((right - 0.5), down);
    rightAntennae2.lineTo(right, (down - 0.5));
    rightAntennae2.lineTo(x, (y + 9.5));
    rightAntennae2.lineTo((x - 0.5), (y + 10));

    //bugBody
    var bugBody = new Path2D();
    bugBody.moveTo(x, p2y);
    bugBody.bezierCurveTo(left, h1y, left, h2y,
        x, up);
    bugBody.bezierCurveTo(right, h2y, right, h1y,
        x, p2y);

    ctx.globalAlpha = opacity;
    //front left foot
    ctx.fillRect(legX1, (y + 6.5), legWidth, legHeight);
    //front right foot
    ctx.fillRect(legX2, (y + 6.5), legWidth, legHeight);
    //middle left foot
    ctx.fillRect(legX1, (y - 1.5), legWidth, legHeight);
    //middle right foot
    ctx.fillRect(legX2, (y - 1.5), legWidth, legHeight); 
    //back left foot
    ctx.fillRect(legX1, h2y, legWidth, legHeight);
    //back right foot
    ctx.fillRect(legX2, h2y, legWidth, legHeight);

    ctx.fill(head);
    ctx.fill(leftAntennae1);
    ctx.fill(leftAntennae2);
    ctx.fill(rightAntennae1);
    ctx.fill(rightAntennae2);
    ctx.fill(bugBody);
    ctx.restore();
}

/*stores x,y coords as well as the points, speed and
colour of the bug into am object*/
function bugInfo(x, y, points, speed, colour){
    this.x = x;
    this.y = y;
    this.points = points;
    this.speed = speed;
    this.colour = colour;
    this.angle = 0;
    this.opacity = 1;
}

/*checks nearest food, return the index of that food*/
function bugFood(x, y){
    var nearestFood = 0;
    var prevDist = distanceCalc(x,y,foods[nearestFood]);

    for(var i = 1; i < foods.length; i++){
        var newDist = distanceCalc(x,y, foods[i]);
        if (newDist < prevDist){
            nearestFood = i;
            prevDist = newDist;
        }
    }
    return nearestFood;
}

/*
 Pushes the bugInfo into allBugs while calling on bugGraph
 to generate the bug on screen 
*/
function bugDraw(ctx){
    if(bugTimeRand()){
        var rand = bugColourRand();
        var colour = bugColour[rand];
        var speed = finalSpeed[rand];
        var point = bugScore[rand];
        var x = bugSpawnRand();
        var y = 50;
        var bug = new bugInfo(x, y, point, speed, colour);
        var angle = Math.round(angleCalc(bug));
        bug.angle = angle;

        ctx.save();
        ctx.translate(bug.x,bug.y);
        ctx.rotate(Math.PI/180 * bug.angle);
        bugGraph(ctx, 0, 0, colour, 1);
        ctx.restore();

        allBugs.push(bug);
    }
}

/*Checks if any bugs in allBugs is in the 30px radius of x,y
If it is, then remove that bug in allBugs, put it into and
add the score of that bug to global var score*/
function bugEradicator(x,y){
    for(var i = 0; i < allBugs.length; i++){
        var bug = allBugs[i];
        if(bugKill(x,y,bug)){
            deadBugs.push(bug);
            allBugs.splice(i, 1);
            score += bug.points;
            scoreDisplay();
        }
    }
}

/*Returns true if bug is within 30px of x,y, coords*/
function bugKill(x,y,bug){
    var distX = x - bug.x;
    var distY = y - bug.y;
    var distanceCenter = Math.sqrt((distX * distX) + (distY * distY))
    var collisionDistance = 30;
    return distanceCenter <= collisionDistance;
}

/*Handles the animation for all bugs' movements and
the vanishing of dead bugs. Ends the game if there are no
more foods*/
function bugAnimation(){

    myReq = requestAnimationFrame(bugAnimation);

    var now = new Date().getTime();
    var dt = now - (time||now);

    time = now;

    createBackground(ctx);
    foodRedraw(ctx);

    var angle;
    var food;

    //bug movement
    for(var i = 0; i < allBugs.length; i++){
        var bug = allBugs[i];
        bugEat(bug);
        angle = Math.round(angleCalc(bug));

        movementDecision(bug, angle, dt);
        ctx.save();
        ctx.translate(bug.x,bug.y);
        ctx.rotate(Math.PI/180 * bug.angle);
        bugGraph(ctx, 0, 0, bug.colour, bug.opacity);
        ctx.restore();

        if(foods.length == 0){
            clearInterval(countdownTimer);
            window.cancelAnimationFrame(myReq);
            endGame();
        }
    }

    //bug vanishing
    for(var i = 0; i < deadBugs.length; i++){
        var dBug = deadBugs[i];
        dBug.opacity -= 0.01;
        ctx.save();
        ctx.translate(dBug.x,dBug.y);
        ctx.rotate(Math.PI/180 * dBug.angle);
        if(dBug.opacity < 0){
            ctx.fillStyle = bgColour;
            ctx.fillRect(-5,-10,10,40);
            deadBugs.splice(i, 1);
        } else{
            bugGraph(ctx, 0, 0, dBug.colour, dBug.opacity);
        }
        ctx.restore();
    }    
}

//checks collision between bugs
function bugCollision(){ //////////// TO DO
    //boolean function
    //returns true if bug is about to collide with another bug
    //base of measure if their front points are within 10px
    //of radius
    //returns otherwise
// Not to offend or anything but I have already invested so much
// time for this assignment that I don't feel like implementing
// anymore. I have 2 more assignments due the next week I'm done
// with this.
}

/*Removes a food from allFoods if bug is at a distance of eating
from the food and clears that food*/
function bugEat(bug){
    var targetInd = bugFood(bug.x, bug.y);
    var targetFood = foods[targetInd];
    var x = bug.x;
    var y = bug.y;
    var dist = distanceCalc(x, y, targetFood);
    var CollisionDistance = foodR + 10;
    if(dist <= CollisionDistance){
        clearFood(targetFood);
        foods.splice(targetInd, 1);
    }
}

/***********************************************************
* Math functions
***********************************************************/

/*
 source: https://developer.mozilla.org/en-US/docs/Web/
            JavaScript/Reference/Global_Objects/Math/random

Returns a random integer within max and min values
*/
function getRandomIntInclusive(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/*Calculates the distance between a donut's x,y coords
and x,y. If there are no more food, ends game*/
function distanceCalc(x, y, donut){
    if(foods.length >0){
        var distX = x - donut.x;
        var distY = y - donut.y;
        return Math.sqrt((distX * distX) + (distY * distY));
    } else {
        clearInterval(countdownTimer);
        window.cancelAnimationFrame(myReq);
        endGame();
    }
}

/*
    http://stackoverflow.com/questions/9614109/
   how-to-calculate-an-angle-from-points

   Returns the angle between the axis and the food, if any.
   Else, end game.
*/
function angleCalc(bug){
    if(foods.length>0){
        var x0 = bug.x;
        var y0 = bug.y;

        var targetInd = bugFood(x0,y0);
        var targetFood = foods[targetInd];

        var x1 = targetFood.x;
        var y1 = targetFood.y

        var dy = y1 - y0;
        var dx = x1 - x0;

        var theta = Math.atan2(dy, dx); // range (-PI, PI]
        theta *= 180 / Math.PI; // rads to degs, range (-180, 180]
        //if (theta < 0) theta = 360 + theta; // range [0, 360)
        return theta - 90;

    } else {
        clearInterval(countdownTimer);
        window.cancelAnimationFrame(myReq);
        endGame();
    }
}

/*
http://math.stackexchange.com/questions/175896/
finding-a-point-along-a-line-a-certain-distance-away-from-another-point

Calculates a new x,y coordinate from the bugs initial coordinate towards
its food according to its speed. Ends the game if there are no more food.
*/

function coordChange(bug, dt){
    if(foods.length > 0){
        var x0 = bug.x;
        var y0 = bug.y;

        var targetInd = bugFood(x0, y0);
        var targetFood = foods[targetInd];
        var x1 = targetFood.x;
        var y1 = targetFood.y;

        var slope = (y1 - y0)/(x1 - x0);
        var d = bug.speed * dt;
        var sub = d / (Math.sqrt(1 + (slope * slope)));

        if(x0 > x1){
            bug.x = bug.x - sub;
            bug.y = slope * (bug.x - x0) + y0;
        }else{
            bug.x = bug.x + sub;
            bug.y = slope * (bug.x - x0) + y0;
        }
    }else{
        clearInterval(countdownTimer);
        window.cancelAnimationFrame(myReq);
        endGame();
        /*if(lvl1 == true){
            reinit();
            gamePlay();
        } else {
            endGame();
        }*/
    } 
}

/*
http://gamedev.stackexchange.com/questions/11905/
rotating-an-object-from-sourceangle-to-destangle-both-0-359-clockwise-or-count

Decides if the bug should turn clockwise or counterclockwise.
*/

function movementDecision(bug, dest, dt){
    var val = (bug.angle - dest + 360) % 360;
    if (val > 180) {
        bug.angle += 1;
    } else if (val == 0){
        coordChange(bug,dt);
    } else {
        bug.angle -= 1;
    }
}













