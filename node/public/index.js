$(document).ready(function(){

  var last_known_scroll_position = 0;
  var ticking = false;
  var status = {currentTemp:20,wantedTemp:22,currentHumid:35,burning:0};

  var ct = new JustGage({
    id: "current-temperature",
    value: 20,
    min: 0,
    max: 40,
    title: "Huidig",
    gaugeColor:"#0000FF",
    label: "°C",
    labelMinFontSize:20,
    valueMinFontSize:45,
    gaugeWidthScale: 0.3,
    labelFontColor: "#000000",
    levelColors: ["#FF0000","#FF0000","#FF0000"]
  });
  var h = new JustGage({
    id: "humidity",
    value: 20,
    min: 0,
    max: 100,
    title: "luchtvochtigheid",
    gaugeColor:"#999999",
    label: "%",
    labelMinFontSize:20,
    valueMinFontSize:45,
    gaugeWidthScale: 0.3,
    labelFontColor: "#000000",
    levelColors: ["#FF0000","#FF0000","#FF0000"]
  });

  var wt = new JustGage({
    id: "wanted-temperature",
    value: 20,
    min: 0,
    max: 40,
    gaugeColor:"#0000FF",
    label: "°C",
    labelMinFontSize:20,
    valueMinFontSize:45,
    gaugeWidthScale: 0.3,
    labelFontColor: "#000000",
    levelColors: ["#FF0000","#FF0000","#FF0000"]
  });

  $.get("/public/presets.json",function (res){
    var presets = res;
    for(var i=0 ;i < presets.length ; i++){
      var preset = presets[i];
      var containerdiv = $("<div class='col-md-4'></div>")
      var newdiv = $( "<div class='card text-white bg-primary mb-3' style='max-width: 20rem;'><img class='card-img' src='" + preset.image + "' alt='Card image'> <div class='card-img-overlay'><h4 class='card-title'>" + preset.name + "</h4> <h1 class='card-text'>" + preset.temperature + "°C</h1></div></div>" );
      newdiv.find(".card-img-overlay").click(setPresetTemp.bind(this,preset.temperature));
      containerdiv.append(newdiv);
      $("#preset-list").append(containerdiv);
    }
  });

  $.get("/public/settings.json",function (res){
    var settings = res;
    $("#night-temp").html(settings["nighttemp"] + "°C");
    $("#day-temp").html(settings["daytemp"] + "°C");
    $("#night-hour").html("After " + settings["nightHour"] + ":00 temperature will be set to:")
    $("#day-hour").html("After " + settings["dayHour"] + ":00 temperature will be set to:")
  });


  $("#temperature-add").click(function(e){
    $.ajax({
      type: "POST",
      url: "/temp",
      data: JSON.stringify({ temp: parseInt(status.wantedTemp) + 1}),
      contentType: 'application/json',
      success: function(data){
        status.wantedTemp = parseInt(data);
        wt.refresh(status.wantedTemp);
      }
    });
    console.log("raising temp");
  });

  $("#temperature-lower").click(function(e){
    $.ajax({
      type: "POST",
      url: "/temp",
      data: JSON.stringify({ temp: parseInt(status.wantedTemp)-1}),
      contentType: 'application/json',
      success: function(data){
        status.wantedTemp = parseInt(data);
        wt.refresh(status.wantedTemp);
      }
    });
  });

  function setPresetTemp(temp){
    $.ajax({
      type: "POST",
      url: "/temp",
      data: JSON.stringify({ temp: temp}),
      contentType: 'application/json',
      success: function(data){
        status.wantedTemp = parseInt(data);
        wt.refresh(status.wantedTemp);
      }
    });
  }

  function updateStatus(){
    $.get("/status", function(res){
      if (res !== ""){
        status = JSON.parse(res);
        wt.refresh(status.wantedTemp);
        ct.refresh(status.currentTemp);
        h.refresh(parseInt(status.currentHumid));
        if(status.burning == 1){
          $("#logo").attr("src","/public/burninglogo.gif");
        }else{
          $("#logo").attr("src","/public/logo.png");
        }
      }
      setTimeout( updateStatus, 1000 ); // <-- when you ge a response, call it
      //        again after a 4 second delay
    });
  }
  updateStatus();
});
