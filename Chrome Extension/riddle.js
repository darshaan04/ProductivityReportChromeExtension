document.getElementById("getRiddle").addEventListener("click", async function () {
    const category = document.getElementById("category").value.trim();
    const riddleText = await fetchRiddle(category);
    document.getElementById("riddle").textContent = riddleText;
});
document.getElementById("getAnotherRiddle").addEventListener("click",async ()=>{
    const category = document.getElementById("category").value.trim();
    const riddleText = await fetchRiddle(category);
    document.getElementById("riddle").textContent = riddleText;
})
document.getElementById("checkAnswer").addEventListener("click", function () {
    const userAnswer = document.getElementById("answer").value.trim().toLowerCase();
    if (userAnswer === correctAnswer.toLowerCase()) {
        document.getElementById("feedback").textContent = "Correct! 🎉";
        document.getElementById("feedback").classList.add("text-success");
    } else {
        document.getElementById("feedback").textContent = "Wrong! Try again.";
        document.getElementById("feedback").classList.add("text-danger");
    }
});

document.getElementById("back-to-home").addEventListener('click',()=>{
    window.location.href='popup.html';
})
let correctAnswer = "";

async function fetchRiddle(category) {
    const requestData = { category: category };
    console.log("calling api");
    try {
        const apiUrl = "http://127.0.0.1:5000/get_riddle";

        const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Received API Response:", data);

        if (data.riddle && data.answer) {
            correctAnswer = data.answer.trim();
            return data.riddle.trim();
        } else {
            throw new Error("Invalid API response format. Missing riddle or answer.");
        }

    } catch (error) {
        console.error("Error fetching riddle:", error);
        return "Failed to load riddle. Try again later.";
    }
}

