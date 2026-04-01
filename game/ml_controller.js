// ML Controller using ml5.js and Teachable Machine
const MODEL_URL = "https://teachablemachine.withgoogle.com/models/8GvFdomxZ/";

let classifier;
let video;
let currentLabel = "reposo"; // default label
let isModelLoaded = false;

// We will store confidence specifically for high threshold
let highConfidenceLabel = "reposo";
const CONFIDENCE_THRESHOLD = 0.85;

function setupML() {
  // Create video capture
  video = createCapture(VIDEO);
  video.size(160, 120);
  video.hide(); // Hide the default HTML element, we'll draw it manually if needed
  
  // Or attach it to the div we created
  let container = select('#video-container');
  if (container) {
      video.parent(container);
      video.show();
  }

  // Load the image classification model
  classifier = ml5.imageClassifier(MODEL_URL + 'model.json', video, modelLoaded);
}

function modelLoaded() {
  console.log("Teachable Machine Model Loaded!");
  isModelLoaded = true;
  classifyVideo();
}

function classifyVideo() {
  classifier.classify(gotResult);
}

function gotResult(error, results) {
  if (error) {
    console.error(error);
    return;
  }
  
  // The results are in an array ordered by confidence.
  if (results && results[0]) {
    currentLabel = results[0].label;
    
    // Only update highConfidenceLabel if it meets threshold
    if (results[0].confidence > CONFIDENCE_THRESHOLD) {
      highConfidenceLabel = currentLabel.toLowerCase();
    } else {
      // If we aren't confident, we default to reposo (idle)
      // or maintain previous frame depending on design, let's default to reposo
      highConfidenceLabel = "reposo"; 
    }
  }
  
  // Classify again!
  classifyVideo();
}

// Function to get the current confident processed input
// returns "izquierda", "derecha", "reposo", "bloqueo"
function getCurrentInput() {
  return highConfidenceLabel;
}

// Ensure the label corresponds to expected names
// Note: Replace with exactly how you named them in TM: "izquierda", "derecha", "reposo", "bloqueo"
