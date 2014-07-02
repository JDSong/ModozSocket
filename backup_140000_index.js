// Setup basic express server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 8080;

var mysql = require("mysql");
var db = mysql.createConnection({
  host : "14.63.186.105",
  port : 3306,
  user : "root",
  password : "modo6521",
  database : "cjyo",
  insecureAuth: true
});

server.listen(port, function () {
  console.log('Modoz_Socket Server listening at port %d', port);
});

// 데이터베이스 커넥션 오류 
db.connect(function(err){
    if (err) console.log(err)
})
 
// 소켓 오류시 
function handler (req, res) {
  fs.readFile(__dirname + '/chat.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading chat.html');
    }
    res.writeHead(200);
    res.end(data);
  });
}

function Insertcallback(err,result){
  if(err){ throw err; }
  console.log("Insert Complete!");
}

function Updatecallback(err,result){
  if(err){ throw err; }
  console.log("Update Complete!");
}

Date.prototype.yyyymmdd = function() {         
  var yyyy = this.getFullYear().toString();                                    
  var mm = (this.getMonth()+1).toString(); // getMonth() is zero-based         
  var dd  = this.getDate().toString();             
  return yyyy + (mm[1]?mm:"0"+mm[0]) + (dd[1]?dd:"0"+dd[0]);
};  

io.sockets.on('connection', function (socket) {

  // 테스트
  socket.on('test',function(data) {
    console.log("JD===test");
    var sqlQuery = "INSERT INTO saram SET ?";
    var post = {id : data.id, name : data.name, age : data.age};
    var query = db.query(sqlQuery, post,callback);
  });

  // 대여 
  socket.on('lent',function(data) {
    console.log("JD===lent");
    var d = new Date();
    var currentDate = d.yyyymmdd();
    
    var d2 = new Date();
    d2.setDate(d2.getDate() + 1);
    var nextDate = d2.yyyymmdd();

    

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
    var query = db.query(sqlQuery, post,Insertcallback);

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

    var query2 = db.query(sqlQuery2, post2,Insertcallback);
    var query3 = db.query('UPDATE Item SET Station= ? ,itemCount = itemCount+1 WHERE itemCode = ?',
                 [data.RStation, data.ItemCode ],Updatecallback);

  });

  // 대여취소
  socket.on('cancel lent',function(username) {
    console.log("JD===cancel lent");
  });

  // 반납
  socket.on('return', function(data) {
    console.log("JD===return");
  });

  // 제품입고 
  socket.on('store product', function(data) {
    console.log("JD===store product");
  });

  // 충전카운트  
  socket.on('charging count', function(data) {
    console.log("JD===charging count");
  });



  socket.on('disconnect', function() {
    console.log("JD===client disconnected");
  });

});

