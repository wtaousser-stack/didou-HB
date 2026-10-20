const $ = id => document.getElementById(id);
const KEY = "fittrack-v1";
const today = new Date().toISOString().slice(0,10);
let data = JSON.parse(localStorage.getItem(KEY) || "{}");
if (data.date !== today) data = {...data, date: today, steps: 0, calories: 0, runSeconds: 0, workoutsToday: []};
data.weight = Number(data.weight || 96);
data.history = data.history || [];
data.workoutsToday = data.workoutsToday || [];
let running = false, startAt = 0, elapsedBefore = 0, ticker = null, sensorOn = false, lastPeak = 0, lastMagnitude = 0;
const save = () => localStorage.setItem(KEY, JSON.stringify(data));
const fmt = s => {s=Math.max(0,Math.floor(s));return [Math.floor(s/3600),Math.floor((s%3600)/60),s%60].map(x=>String(x).padStart(2,"0")).join(":")};
const shortTime = s => {s=Math.floor(s);return String(Math.floor(s/60)).padStart(2,"0")+":"+String(s%60).padStart(2,"0")};
function render(){
  $("steps").textContent=(data.steps||0).toLocaleString();
  $("stepsBar").style.width=Math.min(100,(data.steps||0)/8000*100)+"%";
  $("calories").textContent=Math.round(data.calories||0).toLocaleString();
  $("runTime").textContent=shortTime(data.runSeconds||0);
  $("weightCard").textContent=data.weight.toFixed(1);
  $("heroWeight").textContent=data.weight.toFixed(1);
  $("weightProgress").style.width=Math.max(0,Math.min(100,(96-data.weight)/6*100))+"%";
  $("todayLabel").textContent=new Date().toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric"});
  renderHistory(); save();
}
function renderHistory(){
 const list=$("history");
 if(!data.history.length){list.innerHTML='<p class="muted">Your saved workouts will appear here.</p>';return}
 list.innerHTML=data.history.slice(0,6).map(w=>`<div class="history-item"><div><strong>${w.type==="run"?"🏃 Run":"🚶 Walk"} · ${w.distance?Number(w.distance).toFixed(1)+" km":"Distance not entered"}</strong><span>${w.date} · ${w.duration}</span></div><strong>${w.calories} kcal</strong></div>`).join("");
}
function requestMotion(){
 if(!("DeviceMotionEvent" in window)){alert("Motion sensors are not available in this browser.");return}
 const start = () => {window.addEventListener("devicemotion", motionHandler);sensorOn=true;alert("Step estimate enabled while this page is open. Keep FitTrack in the foreground; iOS may pause sensors in the background.")};
 if(typeof DeviceMotionEvent.requestPermission==="function") DeviceMotionEvent.requestPermission().then(p=>p==="granted"?start():alert("Motion permission was not granted.")).catch(()=>alert("Could not access motion sensors."));
 else start();
}
function motionHandler(e){
 const a=e.accelerationIncludingGravity;if(!a||a.x==null)return;
 const mag=Math.sqrt(a.x*a.x+a.y*a.y+a.z*a.z), now=Date.now();
 // Basic peak detector; estimates only, not a medical-grade pedometer.
 if(mag>12.2 && lastMagnitude<=12.2 && now-lastPeak>280){data.steps=(data.steps||0)+1;data.calories=(data.calories||0)+0.045;lastPeak=now;render()}
 lastMagnitude=mag;
}
$("startRun").addEventListener("click",()=>{
 if(running)return;running=true;startAt=Date.now();$("startRun").disabled=true;$("stopRun").disabled=false;$("workoutStatus").textContent="In progress";
 if(!sensorOn) requestMotion();
 ticker=setInterval(()=>{$("timer").textContent=fmt(elapsedBefore+Math.floor((Date.now()-startAt)/1000))},500);
});
$("stopRun").addEventListener("click",()=>{
 if(!running)return;elapsedBefore+=Math.floor((Date.now()-startAt)/1000);running=false;clearInterval(ticker);ticker=null;
 $("timer").textContent=fmt(elapsedBefore);$("startRun").disabled=false;$("stopRun").disabled=true;$("workoutStatus").textContent="Finished";
});
$("saveWorkout").addEventListener("click",()=>{
 if(running){alert("Finish the workout before saving.");return}
 if(elapsedBefore<=0){alert("Start and finish a workout first.");return}
 const type=$("activity").value, distance=Number($("distance").value||0), hours=elapsedBefore/3600;
 // Approximate MET-based calories. Running is estimated from body weight and distance where possible.
 const calories=Math.round(type==="run"?(distance>0?data.weight*distance*1.0:data.weight*9.8*hours):(data.weight*3.5*hours));
 const workout={type,distance,duration:fmt(elapsedBefore),calories,date:new Date().toLocaleDateString()};
 data.history.unshift(workout);data.workoutsToday.push(workout);data.runSeconds=(data.runSeconds||0)+(type==="run"?elapsedBefore:0);data.calories=(data.calories||0)+calories;
 elapsedBefore=0;$("timer").textContent="00:00:00";$("distance").value="";$("workoutStatus").textContent="Saved";render();
 alert(`Workout saved! Estimated ${calories} kcal.`);
});
$("editWeight").addEventListener("click",()=>{const v=prompt("Enter your current weight in kg",data.weight.toFixed(1));if(v!==null&&Number(v)>=40&&Number(v)<=250){data.weight=Number(v);render()}});
$("productPhoto").addEventListener("change",e=>{const f=e.target.files[0];if(!f)return;const url=URL.createObjectURL(f);$("photoPreview").src=url;$("photoPreview").classList.remove("hidden")});
$("checkProduct").addEventListener("click",()=>{
 const kcal=Number($("foodCalories").value), protein=Number($("protein").value), sugar=Number($("sugar").value), serving=Number($("serving").value||100), ingredients=$("ingredients").value.toLowerCase();
 if(!$("foodCalories").value){alert("Enter the calories from the nutrition label first.");return}
 let score=0, reasons=[];
 if(kcal<=180){score++;reasons.push("Moderate calories per entered serving.")}else if(kcal>=350){score--;reasons.push("Relatively calorie-dense; check your portion size.")}
 if(protein>=10){score++;reasons.push("Good protein contribution for the serving.")}
 if(sugar>=15){score--;reasons.push("High sugar for one serving; compare alternatives.")}
 if(/hydrogenated|partially hydrogenated|high fructose corn syrup/.test(ingredients)){score--;reasons.push("Ingredient list includes an item worth limiting where possible.")}
 if(!reasons.length)reasons.push("Not enough information for a strong judgment. Check serving size, fiber, saturated fat, and the full ingredients list.");
 const cls=score>=1?"good":score<=-1?"bad":"warn", label=score>=1?"Looks like a reasonable option":score<=-1?"Consider limiting this product":"Check the portion and compare alternatives";
 $("productResult").className="result "+cls;
 $("productResult").innerHTML=`<strong>${label}</strong><br>${reasons.join(" ")}<br><span style="opacity:.8">This is a simple rule-based guide, not an automatic photo analysis or medical advice. Values are only as accurate as the label details you enter.</span>`;
 $("productResult").classList.remove("hidden");
});
$("clearHistory").addEventListener("click",()=>{if(confirm("Clear saved workout history?")){data.history=[];render()}});
render();
