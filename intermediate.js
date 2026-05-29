// Inside intermediate.js
function saveTestResults() {
    // 1. Grab values from your HTML inputs using their IDs
    const studentEssay = document.getElementById("essayBox").value; 
    
    const dataToSend = {
        participantId: "User_123",
        listeningScore: totalListeningScore, 
        writingEssay: studentEssay
    };

    // 2. Fetch to Google
    fetch('https://script.google.com/macros/s/AKfycbytP-Aa4tokh2OXTbC4tP7Cxqc863_q1GvilWyQ8Dxen7PdixGi-5t8fwgGr3iF9Cwq2A/exec', {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
    })
    .then(res => res.json())
    .then(data => alert("Saved successfully!"))
    .catch(err => console.error(err));
}