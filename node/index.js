const express = require('express');
const app = express();
var fs = require("fs");

var elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client({
  host: '192.168.88.3:9200',
  log: 'info'
});

client.ping({
  requestTimeout: 30000,
}, function (error) {
  if (error) {
    console.error('elastic: elasticsearch cluster is down!');
  } else {
    console.log('elastic: All is well');
  }
});



var bodyParser = require('body-parser')
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));
app.use('/public', express.static(__dirname + '/public'))

var schedule = require('node-schedule');

const SerialPort = require('serialport');
const Readline = SerialPort.parsers.Readline;
var port = new SerialPort('/dev/ttyUSB0',{
  baudRate: 9600
});
const parser = new Readline();
port.pipe(parser);



//some default status values
var status = {currentTemp:20,wantedTemp:22,currentHumid:35,burning:1};

//load settings
var settings = JSON.parse(fs.readFileSync(__dirname + '/public/settings.json'));

//setup automatic night and day temperature change using cron at 6AM and 11PM
var dayTimeCron = schedule.scheduleJob({hour: settings.dayHour}, function(){
  updateWantedTemp(settings.daytemp);
});

var nightTimeCron = schedule.scheduleJob({hour: settings.nightHour}, function(){
  updateWantedTemp(settings.nighttemp);
});

//setup serial connection to arduino
port.open(function (err) {
  if (err) {
    return console.log('Error opening port: ', err.message);
  }

  // Because there's no callback to write, write errors will be emitted on the port:
  port.write(status.wantedTemp+"\n");
});

// Open errors will be emitted as an error event
port.on('error', function(err) {
  console.log('Error: ', err.message);
})

parser.on('data', function (data) {
  console.log('Data:', data);
  updateStatus(data);
});

//here come the HTTP mapping functions
app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

app.get('/status',function(req,res){
  res.send(JSON.stringify(status));
})

app.post('/temp',function(req,res){
  if(!isEmpty(req.body)){
    updateWantedTemp(req.body.temp);
    res.send(status.wantedTemp + "");
  }
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
});

//update temperature and sent to arduino
function updateWantedTemp(temp){
      status.wantedTemp = temp;
      port.write(temp + "\n");
}

function isEmpty(obj) {
  for(var prop in obj) {
    if(obj.hasOwnProperty(prop))
    return false;
  }
  return JSON.stringify(obj) === JSON.stringify({});
}

//set new status on push from arduino
function updateStatus(data){
  var dataArray = data.split(":");
  status = {currentTemp : dataArray[0], currentHumid : dataArray[1], wantedTemp : dataArray[2], burning : dataArray[3]};
  logStatus();
}

//push current status to elasticsearch
function logStatus(){
  client.index({
    index: 'temp-status',
    type: 'temp-statustype',
    body: {
      wantedTemp: status.wantedTemp,
      currentTemp: status.currentTemp,
      currentHumid: status.currentHumid,
      burning: status.burning,
      date: Math.floor(Date.now())
    }
  }, function (error, response) {

  });
}
