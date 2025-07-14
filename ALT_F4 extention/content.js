
console.log("Eye Manager Content Script Running");

document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;
  setInterval(() => {
    body.style.filter = "brightness(90%)"; // Simulate eye comfort mode
  }, 60000);
});