import {
  frontProfileJSON,
  sideProfileJSON,
  attributeStringToShort,
} from "../utils/profile";
const md5 = require("md5");

export class MeasurementItem {
  constructor(name, value, score=null, index=null, ideal=null, mean=null, advice=null, max=null) {
    this.name = name;
    this.value = value;
    this.score = score;
    this.index = index;
    this.ideal = ideal;
    this.mean = mean;
    this.advice = advice;
    this.max = max;
  }
  upgrade(newMeasurement){
    this.name = newMeasurement.name;
    this.value = newMeasurement.value;
    this.score = newMeasurement.score;
    this.index = newMeasurement.index;
    this.ideal = newMeasurement.ideal;
    this.mean = newMeasurement.mean;
    this.advice = newMeasurement.advice;
    this.max = newMeasurement.max;
  }
  isSet(){
    return this.score!==null;
  }
}

export class Profile {
  constructor(measurementsJson) {
    this.score = null;
    this.imgSrc = null;
    this.measurements = [];
    this.featurePoints = [];
    for (const key in measurementsJson) {
      if (measurementsJson.hasOwnProperty(key)) {
        const value = measurementsJson[key];
        this.addMeasurement(new MeasurementItem(key, value));
      }
    }
  }

  addMeasurement(measurement) {
    this.measurements.push(measurement);
  }

  getMeasurement(name) {
    return this.measurements.find((measurement) => measurement.name === name);
  }

  setMeasurement(name, value) {
    const measurement = this.getMeasurement(name);
    if (measurement) {
      measurement.value = value;
    } else {
      this.addMeasurement(new MeasurementItem(name, value));
    }
  }

  upgradeMeasurement(name, newMeasurement){
    const measurement = this.getMeasurement(name);
    if (measurement) {
      measurement.upgrade(newMeasurement);
    }
  }

  async mainProcess(gender, race, endpoint) {
    let requestBody = {
      gender: gender === "Male",
      racial: race,
    };
    // eslint-disable-next-line array-callback-return
    this.measurements.map((measurementItem) => {
      requestBody[attributeStringToShort[measurementItem.name]] = measurementItem.value;
    });
    fetch(`http://localhost:8000/${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    })
      .then((response) => response.json())
      .then((data) => {
        for(const i in data.advices){
          const temp = new MeasurementItem(data.names[i], data.values[i], data.scores[i], i, data.ranges[i], data.notes[i], data.advices[i], data.maxs[i]);
          const one = this.getMeasurement(data.names[i]);
          one.upgrade(temp);
        }
        this.score = data.score;
      });
  }

  getPercentage(){
    return 100;
  }

  copy(src){
    this.score = src.score;
    this.imgSrc = src.imgSrc;
    this.measurements = src.measurements;
    this.featurePoints = src.featurePoints;
  }
}

export class OneProfile {
  constructor(gender = null, race = null, name = "Unnamed") {
    this.id = this.createID();
    this.gender = gender;
    this.race = race;
    this.name = name;
    this.score = 0;
    this.frontProfile = new Profile(frontProfileJSON);
    this.sideProfile = new Profile(sideProfileJSON);
  }

  createID() {
    const timestamp = Date.now();
    const randomNum = Math.floor(Math.random() * 10000);
    const email = localStorage.getItem("userEmail");
    const dataToHash = `${timestamp}-${randomNum}-${email}`;
    const uniqueID = md5(dataToHash);
    return uniqueID;
  }

  async getHarmony(str) {
    if (str === "Front") {
      await this.frontProfile.mainProcess(this.gender, this.race, "getfrontscore");
    } else if (str === "Side") {
      await this.sideProfile.mainProcess(this.gender, this.race, "getsidescore");
    }
  }

  save() {}
  copy(src) {
    this.id = src.id;
    this.gender = src.gender;
    this.race = src.race;
    this.name = src.name;
    this.score = src.score;
    this.frontProfile = new Profile();
    this.frontProfile.copy(src.frontProfile);
    this.sideProfile = new Profile();
    this.sideProfile.copy(src.sideProfile);
  }
}