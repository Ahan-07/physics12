let allQuestions = [];
let filtered = [];
let index = 0;
let score = 0;
let answered = false;

/* ===========================
   LOAD DATA
=========================== */
fetch("physics_cleaned.json")
.then(res => res.json())
.then(data => {
    allQuestions = normalizeAndExpand(data);
    setSection("all");
})
.catch(err => console.error("JSON Load Error:", err));


/* ===========================
   NORMALIZE + EXPAND
=========================== */
function normalizeAndExpand(data){

    let arr = [];

    data.forEach(item => {

        if(!item || typeof item !== "object") return;

        // Ignore section labels
        if(item.type === "section") return;

        // Expand case study
        if(item.type === "case-study" && Array.isArray(item.questions)){
            item.questions.forEach(q=>{
                arr.push({
                    type: "mcq",
                    topic: item.topic,
                    q: q.q,
                    options: q.options,
                    answer: q.answer,
                    passage: item.passage
                });
            });
            return;
        }

        // Auto detect type if missing
        let type = item.type || "";

        if(!type){
            if(Array.isArray(item.options) && typeof item.answer === "number")
                type = "mcq";
            else
                type = "long";
        }

        arr.push({
            type: type,
            topic: item.topic || "General",
            q: item.q,
            options: item.options || [],
            answer: item.answer || "",
            formula: item.formula || "",
            passage: item.passage || ""
        });

    });

    return arr;
}


/* ===========================
   SECTION FILTER
=========================== */
function setSection(type, e){

    document.querySelectorAll(".sections button")
        .forEach(b=>b.classList.remove("active"));

    if(e) e.target.classList.add("active");

    if(type === "all")
        filtered = [...allQuestions];

    else if(type === "case")
        filtered = allQuestions.filter(q => q.passage);

    else
        filtered = allQuestions.filter(q =>
            q.type === type ||
            (type === "mcq" &&
                (q.type === "assertion-reason" ||
                 (Array.isArray(q.options) && typeof q.answer === "number")))
        );

    index = 0;
    score = 0;
    updateStats();
    loadQuestion();
}


/* ===========================
   LOAD QUESTION
=========================== */
function loadQuestion(){

    answered = false;

    document.getElementById("options").innerHTML = "";
    document.getElementById("answerBox").style.display = "none";
    document.getElementById("longSection").style.display = "none";
    document.getElementById("passage").style.display = "none";

    let q = filtered[index];
    if(!q) return;

    document.getElementById("topic").innerText = q.topic;
    document.getElementById("question").innerText = q.q;

    let progress = ((index+1)/filtered.length)*100;
    document.getElementById("progressFill").style.width = progress+"%";
    document.getElementById("progressText").innerText =
        `Question ${index+1} of ${filtered.length}`;

    if(q.passage){
        document.getElementById("passage").innerText = q.passage;
        document.getElementById("passage").style.display = "block";
    }

    /* ================= MCQ TYPES ================= */
    if(
        q.type === "mcq" ||
        q.type === "assertion-reason" ||
        (Array.isArray(q.options) && typeof q.answer === "number")
    ){

        q.options.forEach((opt,i)=>{
            let div = document.createElement("div");
            div.className = "option";
            div.innerText = opt;
            div.onclick = () => checkMCQ(i);
            document.getElementById("options").appendChild(div);
        });
    }

    /* ================= THEORY TYPES ================= */
    else{

        document.getElementById("longSection").style.display = "block";
        document.getElementById("longAnswer").value = "";
    }
}


/* ===========================
   MCQ CHECK
=========================== */
function checkMCQ(i){

    if(answered) return;
    answered = true;

    let q = filtered[index];
    let options = document.querySelectorAll(".option");

    if(i === q.answer){
        score++;
        options[i].classList.add("correct");
    }
    else{
        options[i].classList.add("wrong");
        if(options[q.answer])
            options[q.answer].classList.add("correct");
    }

    showAnswer(q.options[q.answer]);
    updateStats();
}


/* ===========================
   LONG / NUMERICAL / DERIVATION
=========================== */
function checkLong(){

    if(answered) return;
    answered = true;

    let q = filtered[index];
    let user = document.getElementById("longAnswer").value.trim();

    if(user.length > 5)
        score++;

    showAnswer(q.answer || q.formula);
    updateStats();
}


/* ===========================
   SHOW ANSWER
=========================== */
function showAnswer(text){
    let box = document.getElementById("answerBox");
    box.innerText = "Answer: " + (text || "Not Available");
    box.style.display = "block";
}


/* ===========================
   NEXT QUESTION
=========================== */
function nextQuestion(){

    if(index < filtered.length - 1){
        index++;
        loadQuestion();
    }
    else{
        alert("Section Completed! Final Score: " + score);
    }
}


/* ===========================
   UPDATE STATS
=========================== */
function updateStats(){
    document.getElementById("score").innerText = score;
    document.getElementById("total").innerText = filtered.length;
}
