class Fitness{
 constructor(name, type, target, units) {
  this.id = Date.now() + Math.random();
  this.name = name;
  this.type = type;
  this.target = target;
  this.units = units;
  this.sessions = [];
  this.streak = 0;
  this.bestStreak = 0;
  this.personalRecord = 0;
  this.totalSessions = 0;
}

};

// let fitness = new Habit("pushups" , "strength", 30, "reps")  ignore just testing
// console.log(fitness.type)

class FitnessManager{
  #fitness = [];

  constructor() {
    this.loadLocalStorage()
  }

  addWorkout(name, type , target , units){
    let fitness = new Fitness(name, type , target , units);
    console.log(fitness)
    this.#fitness.push(fitness)
    this.saveLocalStorage()
  };

  deleteWorkout(id){
    this.#fitness = this.#fitness.filter(f => f.id !== id);
    this.saveLocalStorage()
  };

 logWorkout(workoutId, actualAmount){
  let fitness = this.#fitness.find(f => f.id === workoutId);
  if(!fitness) return;

  let today = new Date().toDateString();
  let existingSession = fitness.sessions.find(s => s.date === today);

  if(existingSession){
    existingSession.actual = actualAmount
    existingSession.completed = actualAmount >= fitness.target

  } else{
    let session = {
      date: today,
      actual: actualAmount,
      completed: actualAmount >= fitness.target,
      restDay: false
    }

    fitness.sessions.push(session);
  }

  if(actualAmount > fitness.personalRecord){
    fitness.personalRecord = actualAmount;
  }

  fitness.totalSessions = fitness.sessions.length;

  this.Streakcount(workoutId);
  this.saveLocalStorage();
 };

 markRestday(Id){
  let fitness = this.#fitness.find(f => f.id === Id);
  if(!fitness) return;

  let today = new Date().toDateString();
  let rest = fitness.sessions.find(s => s.date === today)

  if(rest){
    rest.restDay = true,
    rest.completed = false,
    rest.actual = 0;
  } else{

    const session = {
      date: today,
      actual: 0,
      completed: false,
      restDay: true
    }
    fitness.sessions.push(session)
  }

  this.Streakcount(Id);
  this.saveLocalStorage();
 }

  Streakcount(Id){
    let fitness = this.#fitness.find(f => f.id === Id);

    if(!fitness || fitness.sessions.length === 0){
      fitness.streak = 0;
      return
    }

    let streak = 0;
    let today = new Date();

    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today)
      checkDate.setDate(today.getDate() - i)
      let datestring = checkDate.toDateString();

      let session = fitness.sessions.find(s => s.date === datestring);

      if(session){
        if(session.restDay){
          continue;
        } else if(session.completed){
          streak++
        } else{
          break
        } 
      } else{
        break;
      }


    }
    fitness.streak = streak
    if(streak > fitness.bestStreak){
      fitness.bestStreak = streak

    }

    
  };

  getWeekSessions(Id){
    let fitness = this.#fitness.find(f => f.id === Id)
    if(!fitness)return  [];

    let weekDate = [];
    let today = new Date();

    for (let i = 6; i >= 0; i--) {
      const checkDate = new Date(today)
      checkDate.setDate(today.getDate() - i)
      let stringDate = checkDate.toDateString();


      const session = fitness.sessions.find(s => s.date === stringDate);

      let status = "empty";

      if(session){
        if(session.restDay){
          status = "rest"
        } else if (session.completed){
          status = "done"
        } else{
          status = "missed"
        }

        }

        weekDate.push({
      dayName: checkDate.toLocaleDateString('en-US', {weekday: 'short'}),
      date: stringDate,
      status: status
        })
      }

      return weekDate;
      
    }
  

  isCompletedToday(Id){
    let fitness = this.#fitness.find(f => f.id === Id)

    if(!fitness) return false;

    let today = new Date().toDateString();
    let session = fitness.sessions.find(s => s.date === today);

    return session && session.completed && !session.restDay
  };

  getFitness(){
    return [...this.#fitness]
  }

  getTotalSessions(){
    return this.getFitness().length;
  };

  getActiveWorkouts(){
    let fitness = this.#fitness;
    return fitness.filter(f => f.sessions.some(s => s.completed)).length;
  };

  getBestStreak(){
    if(this.#fitness.length === 0) return 0;
    return Math.max(...this.#fitness.map(f => f.streak));

  }

 getThisWeekCount(){
  const today = new Date();
  let startOfWeek = new Date(today);
  let dayOfWeek = today.getDay();
  
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  startOfWeek.setDate(today.getDate() - diff);
  
  let count = 0;
  
  for(let i = 0; i < 7; i++) {
    const checkDate = new Date(startOfWeek);
    checkDate.setDate(startOfWeek.getDate() + i);
    const dateString = checkDate.toDateString();
    
    const hasWorkout = this.#fitness.some(f => 
      f.sessions.some(s => s.date === dateString && (s.completed || s.restDay))
    );
    
    if(hasWorkout) count++;
  }
  
  return count;
}

  filteringType(filter){
    if(filter === "all"){
      return this.getFitness()
    }
  return  this.#fitness.filter(f => f.type === filter)
  };

  filteringAll(filter){
    if(filter === "all"){
      return this.getFitness()
    }

    return this.#fitness.filter(f => f.units === filter)
  }


  saveLocalStorage(){
    localStorage.setItem("fitness", JSON.stringify(this.#fitness))
  }

  loadLocalStorage(){
    let data = localStorage.getItem("fitness")
    if(data){
      this.#fitness = JSON.parse(data)
    }
  }

}

class UIRenderer{
constructor(manager) {
  this.manager = manager
}

renderWeek(Id){
  let weekDate = this.manager.getWeekSessions(Id)

return weekDate.map(day => {
    let icon = "";
    let className = "";

    if(day.status === "done"){
      icon = "☑️"
      className = "done"
    } else if(day.status === "missed"){
      icon = "❌";
      className = "missed"
    } else if(day.status === "rest"){
      icon = "⭕";
      className = "rest"
    } else{
      icon = "⌛";
      className = "";
    }

   return `
      <div class="day-box ${className}">
        <div class="day-icon">${icon}</div>
        <div class="day-label">${day.dayName}</div>
      </div>
    `;
  }).join('');

}

renderFitnessList(filter = "all"){
  let fitness = document.getElementById("workoutList");
  let typeResult = this.manager.filteringType(filter);
  let allResult = this.manager.filteringAll(filter);
  let filtertype = typeResult.length > 0 ?  typeResult : allResult;

  if(filtertype.length === 0){
    fitness.innerHTML = `
    <div class= "Emptytype">
    <h2>Not fitness ${filter === "all" ? "yet" : "here"}</h2>
    <p>${filter === "all" ? "add your first fitness to start" : "No fitness start yet"}</p>
    </div>
    `;
    return
  }

  fitness.innerHTML = filtertype.map(fitness => {
    let completedtoday = this.manager.isCompletedToday(fitness.id);
    let today = new Date().toDateString();
    let todaysession = fitness.sessions.find(s => s.date === today);
    let actualtoday = todaysession ? todaysession.actual : 0;
    let completedPercent = Math.round((actualtoday / fitness.target) * 100);

    return `
    <div class="workoutStore ${completedtoday ? "completed" : ""}">
    <div class="header">
    <div class="heading">
    <h2>${fitness.name}</h2>
    <span>${fitness.target} ${fitness.units}</span>
    </div>
    <span>${fitness.type}</span>
    </div>
    <div class="mainThing">
    <div class="Inputs&Btn">
    <input type="number" data-id="${fitness.id}" placeholder="enter here">
    <button data-id="${fitness.id}"  class="complete-Btn ${completedtoday ? "completed" : ""}">${completedtoday ? "logged" : "log now"}</button>
    </div>
    <span>${actualtoday}/${fitness.target} ${fitness.units} (${completedPercent}%)</span>
    <div class="Progress">
    <div class="ProgressBar " style="width: ${completedPercent}%"></div>
    </div>
    </div>
    <div class="workoutBoxes">
       <div class="workBox" id="workoutStreak">
      <p >${fitness.streak}</p>
      <h3>Streak</h3>
    </div>
    <div class="workBox"id="workoutPR">
      <p>${fitness.personalRecord}</p>
      <h3>PR</h3>
    </div>
    <div class="workBox" id="workoutTotal">
    <p>${fitness.totalSessions}</p>
    <h3>Total</h3>
    </div>
    </div>
    <div class="weekBoxes">${this.renderWeek(fitness.id)}
    </div>
    <button class="delete-Btn" data-id="${fitness.id}">Delete</button>
        <button class="restDay" data-id="${fitness.id}">Rest Day</button>

    </div>
    `
  }).join('')
}

renderTopBoxes(){
  let totalWorkout = document.getElementById("Total");
  let totalActive = document.getElementById("Active");
  let BestStreak = document.getElementById("Streak");
  let totalWeekday = document.getElementById("Week");

  let total = this.manager.getTotalSessions();
  let active = this.manager.getActiveWorkouts();
  let best = this.manager.getBestStreak();
  let week = this.manager.getThisWeekCount();

  totalWorkout.textContent = `${total}`;
  totalActive.textContent = `${active}`;
  BestStreak.textContent = `${best}`;
  totalWeekday.textContent = `${week}/7`;
}

renderAll(){
  this.renderTopBoxes();
  this.renderFitnessList();
}
}

class App{
  constructor() {
    this.manager = new FitnessManager();
    this.renderer = new UIRenderer(this.manager);
    this.currentFilter = "all";

    this.renderer.renderAll()

    this.saveeventListener();
  }

  saveeventListener(){
    document.getElementById("addBtn").addEventListener("click" , (e)=> {
      let input = document.getElementById("workoutInput");
      let type = document.getElementById("type");
      let input2 = document.getElementById("inputs");
      let type2 = document.getElementById("units");

      let name = input.value.trim();
      let strength = type.value;
      let target = input2.value.trim();
      let unit = type2.value;

      if(!name || !target){
        alert("please enter the workout name");
        return
      } 

      this.manager.addWorkout(name,strength,target,unit);
      input.value = "";
      type.value = "";
      input2.value = "";
      type2.value = "";

      this.renderer.renderAll()

    })
      document.getElementById("workoutList").addEventListener("click" , (e)=>{
        if(e.target.classList.contains("delete-Btn")){
          let id = parseFloat(e.target.dataset.id);
          this.manager.deleteWorkout(id);
          this.renderer.renderAll()
        }
        
        if(e.target.classList.contains("complete-Btn")){
           let id = parseFloat(e.target.dataset.id);
          let input = e.target.previousElementSibling;
          let actualAmount = parseFloat(input.value);

          if(!actualAmount || actualAmount <= 0){
            alert("please enter valid amount")
            return
          }

          this.manager.logWorkout(id , actualAmount);
          this.renderer.renderAll()

        }

        if(e.target.classList.contains("restDay")){
          let id = parseFloat(e.target.dataset.id)
          this.manager.markRestday(id);
          this.renderer.renderAll()
        }

      })

          document.getElementById("filtering").addEventListener("change", (e) => {
        this.currentFilter = e.target.value;
        this.renderer.renderFitnessList(this.currentFilter);
        this.renderer.renderTopBoxes();
      });

      document.querySelector(".filtered").addEventListener("click" , (e) => {
        if(e.target.classList.contains("filter")){
          this.currentFilter = e.target.dataset.filter;

          document.querySelectorAll(".filter").forEach(button => {
            button.classList.remove("active")
          })

          e.target.classList.add("active")

          this.renderer.renderFitnessList(this.currentFilter);
          this.renderer.renderTopBoxes();
        }
      })
      
  }
}

let app = new App();

let manager =  new FitnessManager();
console.log(manager.getFitness())