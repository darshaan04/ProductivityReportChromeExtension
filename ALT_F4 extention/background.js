let activeTabs = {}; // Store active tab data { tabId: { domain, startTime, intervalId } }

// Extract root domain from URL
function getDomain(url) {
    try {
        return new URL(url).hostname.replace("www.", ""); // Remove 'www.' for cleaner names
    } catch (error) {
        return "Unknown";
    }
}

// Start tracking time for a tab
function trackTime(tabId, url) {
    if (!url || url.startsWith("chrome://") || url.startsWith("about:") || url.startsWith("edge://") || url.startsWith("file://")) return; // Ignore system tabs

    let domain = getDomain(url);

    // If already tracking the same tab with the same domain, do nothing
    if (activeTabs[tabId] && activeTabs[tabId].domain === domain) {
        return;
    }

    stopTracking(tabId); // Ensure previous tracking is stopped

    let startTime = Date.now();

    activeTabs[tabId] = {
        domain,
        startTime,
        intervalId: setInterval(() => {
            chrome.storage.local.get({ activeSites: {} }, (data) => {
                let activeSites = data.activeSites || {};
                activeSites[domain] = (activeSites[domain] || 0) + 1;

                chrome.storage.local.set({ activeSites }, () => {
                    if (chrome.runtime.lastError) {
                        console.error("Error saving active site data:", chrome.runtime.lastError);
                    }
                });
            });
        }, 1000), // Updates every second
    };

    console.log(`Started tracking: ${domain}`);
}

// Stop tracking a tab when closed or switched
function stopTracking(tabId) {
    if (activeTabs[tabId]) {
        let { domain, startTime, intervalId } = activeTabs[tabId];
        let duration = ((Date.now() - startTime) / 1000).toFixed(2); // Convert ms to seconds

        clearInterval(intervalId);

        if (domain && domain !== "Unknown") {
            classifyDomain(domain).then((category) => {
                chrome.storage.local.get({ closedSites: [] }, (data) => {
                    let closedSites = data.closedSites || [];

                    let newEntry = { domain, duration, category };
                    closedSites.push(newEntry);

                    chrome.storage.local.set({ closedSites }, () => {
                        if (chrome.runtime.lastError) {
                            console.error("Error saving closed site data:", chrome.runtime.lastError);
                        } else {
                            console.log(`Tab closed: ${domain} | Duration: ${duration} seconds`);
                            saveClosedSitesToDB(newEntry); // Send data to backend
                        }
                    });
                });
            });
        }

        delete activeTabs[tabId]; // Remove from tracking
    }
}

// Fetch category from backend API
async function classifyDomain(domain) {
    try {
        let response = await fetch("http://127.0.0.1:5000/get_category", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ domain }),
        });

        let data = await response.json();
        return data.category || "Unknown Category";
    } catch (error) {
        console.error("Error classifying domain:", error);
        return "Error Classifying";
    }
}

// Send closed site data to backend
function saveClosedSitesToDB(lastClosedSite) {
    fetch("http://127.0.0.1:5000/save_data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lastClosedSite }),
    })
    .then(response => response.json())
    .then(data => console.log("Data saved successfully:", data))
    .catch(error => console.error("Error saving data:", error));
}

// Detect tab updates (e.g., new URL loaded)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    console.log(`Tab updated: ID=${tabId}, Status=${changeInfo.status}, URL=${tab.url}`);
    if (changeInfo.status === "complete" && tab.url) {
        trackTime(tabId, tab.url);
    }
});

// Detect tab switch (user changes active tab)
chrome.tabs.onActivated.addListener((activeInfo) => {
    chrome.tabs.get(activeInfo.tabId, (tab) => {
        if (tab.url) trackTime(activeInfo.tabId, tab.url);
    });
});

// Detect tab close
chrome.tabs.onRemoved.addListener((tabId) => {
    if (tabId in activeTabs) {
        stopTracking(tabId);
    }
});

// Cleanup when extension is unloaded
chrome.runtime.onSuspend.addListener(() => {
    Object.keys(activeTabs).forEach(stopTracking);
});
