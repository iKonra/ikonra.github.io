const nickname = document.querySelector('#nick');

nickname.addEventListener('click', () => {
  anime({
    targets: nickname,
    translateY: 50,
    opacity: 0,
    duration: 1000,
    easing: 'easeOutExpo'
  });
});