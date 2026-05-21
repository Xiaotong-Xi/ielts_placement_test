// 1. Gather the answers from your experiment variables
const participantData = {
    participantId: expInfo['participant'] || 'unknown', 
    listeningScore: total_listening_correct || 0,   // Change to match your variable names
    readingScore: total_reading_correct || 0,       // Change to match your variable names
    writingEssay: essay_text_response || ""          // Change to match your variable names
};

// 2. Send the answers to your Google Sheet via the Apps Script Web App
fetch('https://script.google.com/macros/s/AKfycbytP-Aa4tokh2OXTbC4tP7Cxqc863_q1GvilWyQ8Dxen7PdixGi-5t8fwgGr3iF9Cwq2A/exec', {
    method: 'POST',
    mode: 'cors', // Crucial to prevent GitHub vs Google security block
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(participantData)
})
.then(response => response.json())
.then(data => {
    console.log('Data successfully saved to Google Sheets!', data);
    // Finally, close the experiment or redirect the user
    psychoJS.quit({message: 'Thank you! Your responses have been saved.'});
})
.catch(error => {
    console.error('Error saving data:', error);
    psychoJS.quit({message: 'Data saving failed, please screenshot your results.'});
});