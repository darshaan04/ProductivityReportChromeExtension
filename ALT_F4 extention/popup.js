document.getElementById('riddle-btn').addEventListener('click',()=>{
    window.location.href = "riddle.html";
})
document.addEventListener("DOMContentLoaded", () => {
    updateActiveSites();
    updateClosedSites();

    // Refresh every second
    setInterval(() => {
        updateActiveSites();
        updateClosedSites();
    }, 1000);
});

// Show currently open sites with live tracking
function updateActiveSites() {
    chrome.storage.local.get({ activeSites: {} }, (data) => {
        const siteList = document.getElementById("activeSites");
        if (!siteList) return; // Ensure the element exists
        siteList.innerHTML = "";

        if (Object.keys(data.activeSites).length === 0) {
            siteList.innerHTML = "<li>No active sites</li>";
            return;
        }

        Object.entries(data.activeSites).forEach(([site, time]) => {
            let li = document.createElement("li");
            li.textContent = `${site}: ${time} seconds`;
            siteList.appendChild(li);
        });
    });
}

// Show closed sites with duration
function updateClosedSites() {
    chrome.storage.local.get({ closedSites: [] }, (data) => {
        const closedList = document.getElementById("closedSites");
        if (!closedList) return; // Ensure the element exists
        closedList.innerHTML = "";

        if (data.closedSites.length === 0) {
            closedList.innerHTML = "<li>No closed sites</li>";
            return;
        }

        data.closedSites.forEach(({ domain, duration, category }) => {
            let li = document.createElement("li");
            li.textContent = `${domain}: Closed after ${duration} seconds`;
            closedList.appendChild(li);
        });

        console.log("Closed Sites:", data.closedSites);
    });
}
