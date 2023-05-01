 // Selecciona el mensaje de error 404
 const message = document.querySelector('#message');

 // Crea la animación usando anime.js
 anime({
   targets: message,
   translateY: ['-5%', '5%'],
   opacity: [0.9, 1],
   loop: true,
   direction: 'alternate',
   easing: 'easeInOutSine'
 });