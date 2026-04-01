const MODEL_URL = "assets/model/";

let classifier;
let video;
let currentLabel = "reposo"; 
let isModelLoaded = false;

// Umbral de certeza matemática del modelo de Teachable Machine para evitar falsos positivos
let highConfidenceLabel = "reposo";
const CONFIDENCE_THRESHOLD = 0.70;

function setupML() {
  video = createCapture(VIDEO);
  video.size(160, 120);
  video.hide(); 
  
  let container = select('#video-container');
  if (container) {
      video.parent(container);
      video.show();
  }

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
  
  if (results && results[0]) {
    currentLabel = results[0].label;
    
    // Solo filtra predicciones estables superiores al percentil definido
    if (results[0].confidence > CONFIDENCE_THRESHOLD) {
      highConfidenceLabel = currentLabel.toLowerCase();
    } else {
      highConfidenceLabel = "reposo"; 
    }
  }
  
  classifyVideo();
}

// Retorna el label de alta confianza actual ("izquierda", "derecha", "reposo", "bloqueo")
function getCurrentInput() {
  return highConfidenceLabel;
}
