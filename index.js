var express = require('express')
  , app = express()
  , server = app.listen(8080)
  , io = require('socket.io').listen(server);

var mysql = require("mysql");
var queues = require("mysql-queues");

var db = mysql.createConnection({
  host : "14.63.186.105",
  port : 3306,
  user : "root",  
  password : "modo6521",
  database : "cjyo",
  insecureAuth: true
});

// 데이터베이스 커넥션 오류 
db.connect(function(err){
    if (err) console.log(err)
});
 
// 소켓 오류시 
function handler (req, res) {
  fs.readFile(__dirname + '/index.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }
    res.writeHead(200);
    res.end(data);
  });
}


io.sockets.on('connection', function (socket) {

  // 서버 사용 가능 여부 
  socket.on('isAlive', function(data){
    console.log("JD===isAlive");
    db.query('select 1', [], function(err, result) {
      if(err) {
        // DB 연결오류
        console.log(err);
        socket.emit('isAlive', { isAlive: false });
      }
      else{
        console.log(result);
        socket.emit('isAlive', { isAlive: true });
      }
    });
  });

  // 대여 
  socket.on('callRent', function(data){
    console.log("JD===callRent");
    
    var d = new Date();
    var currentDate = d.yyyymmdd();
    
    var d2 = new Date();
    d2.setDate(d2.getDate() + 1);
    var nextDate = d2.yyyymmdd();

    console.log("JD=== " + currentDate + "::"  +
        data.CustCode + "::"  +
        data.ItemCode+ "::" +
        nextDate+ "::" +
        data.Station);

    var result = false;
    db.query("CALL BRent(?, ?, ?, ?, ?);", [
        currentDate, 
        data.CustCode , 
        data.ItemCode, 
        nextDate, 
        data.Station], 
      function(err, result) {
        if (err) {
            console.log("JD===MySQL Query Execution Failed....");
            socket.emit('isBRented', { isBRented: false });
            console.log(err);
        }
        else {
          console.log(result);
          socket.emit('isBRented', { isBRented: true });
          console.log('JD===Success Procedure call...');
        }
    });
  });

  socket.on('callCharge', function(data){
    
    console.log("JD=== " +  
        data.ItemCode+ " ::" +
        data.Station);

    var result = false;

    db.query("CALL BCharge(?, ?);", [
        data.ItemCode, 
        data.Station], 
      function(err, result) {
        if (err) {
            console.log("JD===MySQL Query Execution Failed....");
            socket.emit('isBCharged', { isBCharged: false });
            console.log(err);
        }
        else {
          console.log(result);
          socket.emit('isBReturned', { isBCharged: true });
          console.log('JD===Success Procedure call...');
        }
      });
  });

  // 대여 - Simple Query
  socket.on('rent',function(data) {
    console.log("JD===rent");
    var d = new Date();
    var currentDate = d.yyyymmdd();
    
    var d2 = new Date();
    d2.setDate(d2.getDate() + 1);
    var nextDate = d2.yyyymmdd();

    db.query('USE cjyo');
    queues(db, true);

    var trans = db.startTransaction();

    function error(err) {
        if(err && trans.rollback) {trans.rollback(); throw err;}
    }
    
    // 주문테이블이 추가 
    var sqlQuery = "INSERT INTO JumunH SET ?";
    var post = {
      JumunDate: currentDate,
      JumunNo: 1,
      CustCode: data.CustCode,
      ItemCode: data.ItemCode,
      TotalAmt: 2000,
      MagamDate: nextDate,
      ReturnDate: '',
      State: 'A',
      Delay: 'N ',
      RStation: data.RStation,
      TStation: '',
      AddDate: null,
      UpdateDate: null,
      DeleteYn:'N'}; 
    trans.query(sqlQuery, post, error);

    var sqlQuery2 = "INSERT INTO SugumH SET ?";
    var post2 = {
      SugumDate: currentDate,
      SugumNo: 1,
      RentGu: 'R',
      SugumGu: 'A1', //?
      SugumC: 'A1', //?
      Station: data.RStation,
      CustCode: data.CustCode,
      JumunDate: currentDate,
      JumunNo: 1,
      TotalAmt: '', //?
      AddDate: new Date().toISOString().slice(0, 19).replace('T', ' '),
      UpdateDate: new Date().toISOString().slice(0, 19).replace('T', ' '),
      DeleteYn: 'N'};
    trans.query(sqlQuery2, post2, error);

    var sqlQuery3 = 'UPDATE Item SET Station= ? ,itemCount = itemCount+1 WHERE itemCode = ?';
    trans.query(sqlQuery3, [data.RStation, data.ItemCode ], error);

    trans.commit(); 
  });

  // 대여취소
  socket.on('cancel lent',function(username) {
    console.log("JD===cancel lent");

  });

  // 반납
  socket.on('callReturn', function(data) {
    console.log("JD===callReturn");
    
    var d = new Date();
    var currentDate = d.yyyymmdd();
    
    console.log("JD=== " + currentDate + "::"  +
        data.CustCode + "::"  +
        data.ItemCode+ "::" +
        data.Station);

    var result = false;

    db.query("CALL BReturn(?, ?, ?, ?);", [
        currentDate, 
        data.CustCode , 
        data.ItemCode, 
        data.Station], 
      function(err, result) {
        if (err) {
            console.log("JD===MySQL Query Execution Failed....");
            socket.emit('isBReturned', { isBReturned: false });
            console.log(err);
        }
        else {
          console.log(result);
          socket.emit('isBReturned', { isBReturned: true });
          console.log('JD===Success Procedure call...');
        }
      });
  });

  socket.on('disconnect', function() {
    console.log("JD===client disconnected");
  });

});

Date.prototype.yyyymmdd = function() {         
  var yyyy = this.getFullYear().toString();                                    
  var mm = (this.getMonth()+1).toString(); // getMonth() is zero-based         
  var dd  = this.getDate().toString();             
  return yyyy + (mm[1]?mm:"0"+mm[0]) + (dd[1]?dd:"0"+dd[0]);
};  

