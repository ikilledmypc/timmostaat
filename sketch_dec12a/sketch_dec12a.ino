/*
  Liquid flow rate sensor -DIYhacking.com Arvind Sanjeev

  Measure the liquid/water flow rate using this code.
  Connect Vcc and Gnd of sensor to arduino, and the
  signal line to arduino digital pin 2.

*/
#include "dht11.h"

dht11 DHT11;

#define DHT11PIN 3
#define BURNERPIN 4


String readString;
float targetTemp = 20;
float currentTemp = 20;
float tempTotal = 0;
int readCount=0;
bool burning = false;
void setup()
{
  // Initialize a serial connection for reporting values to the host
  Serial.begin(9600);
  pinMode(BURNERPIN, OUTPUT);
  digitalWrite(BURNERPIN, LOW);
}
/**
   Main program loop
*/
void loop()
{


  int chk = DHT11.read(DHT11PIN);

  while (Serial.available()) {
    delay(3);  //delay to allow buffer to fill
    if (Serial.available() > 0) {
      char c = Serial.read();  //gets one byte from serial buffer
      readString += c; //makes the string readString
    }
  }
  if (readString.length() > 0) {
//    Serial.print("setting temperature to: ");
//    Serial.print(readString.toFloat());
//    Serial.print("\n");
    targetTemp = readString.toFloat();
//    Serial.print("target temp set to: ");
//    Serial.print(targetTemp);
//    Serial.println();
    if(round(targetTemp) <= round(currentTemp)){
      digitalWrite(BURNERPIN, false);
      burning = false;
    }else{
      digitalWrite(BURNERPIN, false);
      burning = true;
    }
    readString = "";
  }

  if (chk == DHTLIB_OK) {
    currentTemp = (float)DHT11.temperature;
    Serial.print(round(currentTemp));
    Serial.print(":");
    Serial.print(DHT11.humidity);
    Serial.print(":"); 
    Serial.print(round(targetTemp));
    Serial.print(":");
    Serial.print(burning);
    Serial.print("\n");
    tempTotal += currentTemp;
    readCount++;
  }
  //Serial.println(readCount);
  if (readCount == 600) {
    currentTemp = tempTotal / 600;
  //  Serial.println(currentTemp);
    if (currentTemp < targetTemp) {
      digitalWrite(BURNERPIN, true);
      burning = true;
    } else {
      digitalWrite(BURNERPIN, false);
      burning = false;
    }
    tempTotal = 0;
    readCount =0;
  }

  delay(2000);

}

String getValue(String data, char separator, int index)
{
  int found = 0;
  int strIndex[] = { 0, -1 };
  int maxIndex = data.length() - 1;

  for (int i = 0; i <= maxIndex && found <= index; i++) {
    if (data.charAt(i) == separator || i == maxIndex) {
      found++;
      strIndex[0] = strIndex[1] + 1;
      strIndex[1] = (i == maxIndex) ? i + 1 : i;
    }
  }
  return found > index ? data.substring(strIndex[0], strIndex[1]) : "";
}
