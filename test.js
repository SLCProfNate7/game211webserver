var game = [{
    id: 1,
    Name: "Sonic the HedgeHog",
    Platform: 'Switch',
    Leaderboard:[{
      id:1,
      Player: "NATE",
      Score: 10000,
      Time: null
    },{
        id:2,
        Player: "Muhammad",
        Score: 10002,
        Time: null
      }]
  },
  {
    id: 2,
    Name: "Hollow Knight",
    Platform: 'PC',
    Leaderboard:[{
      id:1,
      Player: "Jayson",
      Score: null,
      Time: "20:21:56:02"
    },{
        id:2,
        Player: "Dean",
        Score: null,
        Time: "19:22:40:20"
      }]
  }];




var bod = {
    name: null,
    platform: "Good"
};

  //Game validation functions body passed in. 
function valid(body){
    var gName = body.name;
    var plat = body.platform;
    var begWhite = /^(\s+).*/;
    var endWhite =  /.*(\s+)$/
    if ((gName == "" && plat == "") || (gName == null && plat == null)){
      //both values empty
      return 1;
    }
    if (( begWhite.test(gName) || endWhite.test(gName) )|| 
        (begWhite.test(plat) || endWhite.test(plat) )){
        //not trimmed
      return 2;
    }
    return 0; 
}


console.log(`Result of bad: ${valid(bod)}`);