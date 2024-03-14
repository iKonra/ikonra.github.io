document.addEventListener("DOMContentLoaded", () => {
    const background = document.querySelector('.background-container');
    let numStars = 0;
    let starSize = 1;
  
    function generateStar() {
      let element;
      if (Math.random() < 0.05) {
        element = generateAsteroid();
      } else {
        element = generateStarElement();
      }
      background.appendChild(element);
      numStars++;
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
      }, 100);
  
      return asteroid;
    }
  
  
    while (numStars < 30) {
      generateStar();
    }
  
  
    setInterval(() => {
      generateStar();
    }, 1500);
  });
  