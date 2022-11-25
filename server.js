const express = require("express");
/*Mongoose Setup*/
var mongoose = require("mongoose");

//Set mongo add cors to server
var cors = require('cors');
var Schema = mongoose.Schema;
let db1 = mongoose.createConnection("mongodb+srv://sl-leaderboard-admin:2bxlDQpCxPQHn7ZX@sl-leaderboard.nbe5bmm.mongodb.net/sl_leaderBoard?retryWrites=true&w=majority");

//Create application and add necessary pacages
const app = express();
app.use(cors());
app.use(express.json());

const HTTP_PORT = process.env.PORT || 8080;


//create mongo schema and leaderboard object
var leaderBoardSchema = new Schema({
  "id": {
    "type": Number,
    "unique":true
  },
  "GameName":  String,
  "Platform": String,
  "Leaderboard": [
    {
        "id": Number,
        "Player": String,
        "Score" : Number,
        "Time"  : String
    }
  ]  
});

var leaderboardOBJ = db1.model("sl_leaderBoard", leaderBoardSchema);

//holds the current highest id (used for adding games)
var HighGameID;


// call this function after the http server starts listening for requests
function onHttpStart() {
  console.log("Express http server listening on: " + HTTP_PORT);
  
  //set highest ID
  leaderboardOBJ.find({},{id:1})
  .exec()
  .then((data)=>{
    data = data.map(value => value.toObject());
    
    data.sort((a,b)=>{
      return b.id - a.id;
    });
    HighGameID = data[0].id;
  }).then(()=>{
    //console.log(`Newest ID is ${HighGameID}`);
  });
}


//check DB connection
db1.once('open', ()=>{
  console.log("db1 success!");
});




// setup a route on the 'root' of the url
// IE: http://localhost:8080/
app.get("/", (req, res) => {
  res.send("<h1>Welcome to the leaderboard API.</h1><p>There is no front end webpages only API calls.</p>");
});

//Game validation functions body passed in. 
function valid(body){
  var gName = body.name;
  var plat = body.platform;
  var begWhite = /^(\s+).*/;
  var endWhite =  /.*(\s+)$/
  if (gName == "" || plat == "" || gName == null || plat == null){
    //both values empty
    console.log("Null or Empty Field");
    return 1;
  }
  else if (( begWhite.test(gName) || endWhite.test(gName) )|| 
      (begWhite.test(plat) || endWhite.test(plat) )){
        console.log("White Space");
      //not trimmed
    return 2;
  }
  else {
    console.log("Data Good");
    return 0; 
  }
}


//Route for adding new game
app.post("/api/games",(req,res)=>{
  let dataGood;
  //check for correct parameters
  try{
    if(typeof req.body.name === 'undefined'||
      typeof req.body.platform === 'undefined'){
        throw "Game body variable missing or typo";
    }

    //checks if trimmed or empty fields
    function findValid (){
      return new Promise((resolve, reject)=>{
        if (valid(req.body)){
          //console.log("Not Valid");
          reject("Not Trimmed or Null/Empty Field");
        }
        else{
          //console.log("Valid");
          resolve();
        }
      });
    }

    //checks for duplicate values in the DB
    function checkDup(){
      return new Promise ((resolve, reject)=>{
        leaderboardOBJ.find({GameName: req.body.name, Platform: req.body.platform},{id:1,GameName:1,Platform:1})
        .exec()
        .then((inData)=>{
          inData = inData.map(value => value.toObject());
          console.log(inData);
          if (inData.length > 0){
            console.log(`Data Good dup: ${dataGood}`);
            console.log("Duplicate");
            dataGood=0;
            reject("Duplicate");
          }
          else{
            console.log("not matching");
            resolve();
          }
        });
      });
    }

    //stores the game in the DB
    function log(){
      return new Promise((resolve,reject)=>{
        ++HighGameID;
        console.log(HighGameID);
        let newGame = new leaderboardOBJ({
          id: HighGameID,
          GameName: `${req.body.name}`,
          Platform: `${req.body.platform}`,
          Leaderboard:[]
        });
        newGame.save().then(()=>{
          console.log("Saved a new game");
          res.json({message: "OK"});
          resolve();
        }).catch((reason)=>{
          console.log(reason);
          reject(reason);
        });
      }) 
    }

    findValid()
    .then(checkDup)
    .then(log)
    .catch((err)=>{
      res.json({message:`${err}`});
    });
  }
  catch(err){
    res.json({messgae: err});
  }
});


//Finds all games
app.get("/api/games", (req, res)=>{
  leaderboardOBJ.find({},{id:1,GameName:1,Platform:1})
  .exec()
  .then((data)=>{
    data = data.map(value => value.toObject());
    res.json(data);
  }).catch((err)=>{
    res.json({message: `Unable to find games: ${err}`});
  });
});


//Function tests if leaderboard isn't trimmed or 
//if ID is not available/null and has at least a time or score
function validLBoard(body){
  let lPayer = body.player;
  let lTime = body.time;
  let lScore = body.score;
  let lID = body.gameID;
  let begWhite = /^(\s+).*/;
  let endWhite =  /.*(\s+)$/
  if (lScore == null && lTime == "" || lScore == null && lTime == null){
    //both values empty
    console.log("Need a value for score or time");
    return "Need a value for score or time";
  }
  else if (( begWhite.test(lPayer) || endWhite.test(lPayer) )|| 
      (begWhite.test(lTime) || endWhite.test(lTime) )){
        console.log("White Space");
      //not trimmed
    return "White Space";
  }
  else if (typeof lID === 'undefined'|| lID == null){
    console.log("ID not available");
    return "ID not available";
  }
  else {
    console.log("Data Good");
    return 0; 
  }
}

//checks if there is a matching leaderboard in array
function checkLDup(body){
  return new Promise((resolve, reject)=>{
    console.log("CheckLDup");
    leaderboardOBJ.findOne({id: body.gameID})
    .exec()
    .then((data)=>{
      console.log("retrieved game");
      if (data.Leaderboard.find((current)=>{
        return (current.Player == body.player && current.Score == body.score && current.Time == body.time)
      })){
        console.log("Matched leader");
        reject("Macthing Data");
      }
      else{
        console.log("No leader in DB");
        resolve();
      }
    })
  });
}

//sees if time is in "xx:xx:xx:xx" format
function validTime(body){
  let time = body.time;
  let timeForm = /^[0-9]+:[0-9]{2}:[0-9]{2}:[0-9]{2}$/;
  if (time == null || timeForm.test(time) ){
    return 0;
  }
  else {
    return "Bad Time Format"; 
  }
}

//gets the current highest id in the leaderboard array
let highLeaderID;
function getHighestLeader(req){
  return new Promise((resolve, reject)=>{
    let inID = req.body.gameID;

    leaderboardOBJ.findOne({id:inID})
    .exec()
    .then((data)=>{
        console.log("Trying highest leader id");
        data = data.toObject();
        console.log(`Leaderboard Array: ${JSON.stringify(data)}`);
        var leader = data.Leaderboard;
        if (leader.length>0){
          leader.sort((a,b)=>{
            return b.id - a.id;
          });
          highLeaderID = leader[0].id;
        }
        else{
          highLeaderID = 0;
        }
      }).then(()=>{
        console.log(`Newest leader ID is ${highLeaderID}`);
        resolve();
      })
      .catch((err)=>{
        console.log(err);
        reject("Couldn't find high leader ID");
      });
  });
};


//add a leaderboard to a game
app.post("/api/leaderBoard/:gameID",(req,res)=>{

  //check for correct body data and names
  try{
    if(typeof req.body.gameID === 'undefined'||
      typeof req.body.player === 'undefined'||
      typeof req.body.score === 'undefined'||
      typeof req.body.time === 'undefined'){
      throw "leaderboard body variable missing or typo";
    }


   // console.log(`post data is: ${JSON.stringify(req.body)}`);

   //checks the data's validity against business rules
    var trimmed = function (){
      console.log("Try Trim");
      return new Promise((resolve, reject)=>{
        let resp;
          if (resp = validLBoard(req.body)){
            reject(resp);
          }
          else{
            resolve();
          }
      });
    }

    //checks time format
    var timed = function (){
      //console.log("Try time Validation");
      return new Promise((resolve, reject)=>{
        let resp;
          if (resp = validTime(req.body)){
            reject(resp);
          }
          else{
            resolve(req.body);
          }
      });
    }
  
    //runs the checks
    getHighestLeader(req)
    .then(trimmed)
    .then(timed)
    .then(checkLDup)
    .then(()=>{
      //adds the leaderboard score
      //console.log("Trying to add");
      ++highLeaderID;
      let tempID = req.body.gameID;
      let tempLeader = {
        id: highLeaderID,
        Player: req.body.player,
        Score: req.body.score,
        Time: req.body.time
      }
      leaderboardOBJ.findOneAndUpdate({id: tempID},
          {$push: {Leaderboard : tempLeader}})
          .exec()
          .then(()=>{
            //console.log("Game added success");
            res.json({message:"ok"});
          })
          .catch((reason)=>{
            //console.log(`Failed to save item ${reason}`);
            res.json({message:`Failed to save item`});
          });
    }).catch((reason)=>{
     // console.log(reason);
      res.json({message: `${reason}`});
    });
  }
  catch(err){
    res.json({message: err});
  }
});



//gets leaderboard data that matches a game ID
app.get("/api/leaderBoard/:gameID", (req, res)=>{
  let inId = req.params.gameID;
  leaderboardOBJ.findOne({id:inId})
  .exec()
  .then((data)=>{
    data = data.toObject();
    res.json(data);
  }).
  catch((err)=>{
    res.json({message: `Failed to find game by ID: ${inId}`});
  });
});


//catches all other requests
app.use((req, res) => {
  res.status(404).send("Page Not Found");
});


//starts the server
app.listen(HTTP_PORT, onHttpStart);