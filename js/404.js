const message = document.querySelector('#message');

anime({
  targets: message,
  translateY: ['-5%', '5%'],
  opacity: [0.7, 1],
  loop: true,
  direction: 'alternate',
  easing: 'easeInOutSine'
});