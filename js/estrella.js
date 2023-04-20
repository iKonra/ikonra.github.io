const background = document.querySelector('.background-container');
const generateStarsBtn = document.querySelector('#generate-stars-btn');
const starCounter = document.querySelector('#star-counter');
let numStars = 0;
let starSize = 1;
let isGeneratingPlanets = false;



function generateStar() {
  let element;
  if (Math.random() < 0.05) { 
    element = generateAsteroid();
  } else {
    element = generateStarElement();
  }
  background.appendChild(element);
  
  numStars++;
  starCounter.innerText = numStars;

  if (numStars % 100 === 0 && numStars <= 1000) {
    starSize += 0.05;
    if (!isGeneratingPlanets) {
      isGeneratingPlanets = true;
      if (numStars === 1000) {
        generateStarsBtn.innerText = 'Generate Planets';
      }
    }
    generatePlanet();
  }
}

function generateStarElement() {
  const star = document.createElement('div');
  star.classList.add('star');
  star.style.top = `${Math.random() * 100}%`;
  star.style.left = `${Math.random() * 100}%`;
  star.style.transform = `scale(${starSize})`;
  return star;
}

function generateAsteroid() {
  const asteroid = document.createElement('div');
  asteroid.classList.add('asteroid');
  asteroid.style.top = `${Math.random() * 100}%`;
  asteroid.style.left = `${Math.random() * 100}%`;

  // movimiento de asteroides
  const intervalId = setInterval(() => {
    const currentTop = parseInt(asteroid.style.top);
    const currentLeft = parseInt(asteroid.style.left);
    const newTop = currentTop + 2; 
    const newLeft = currentLeft + 2; 
    asteroid.style.top = `${newTop}%`;
    asteroid.style.left = `${newLeft}%`;

    if (newTop > 100 || newLeft > 100) {
      clearInterval(intervalId);
      asteroid.remove();
    }
  }, 30);
  
  return asteroid;
}

function generatePlanet() {
  const planet = document.createElement('div');
  planet.classList.add('planet');
  planet.style.top = `${Math.random() * 100}%`;
  planet.style.left = `${Math.random() * 100}%`;
  background.appendChild(planet);
}

generateStarsBtn.addEventListener('click', generateStar);
