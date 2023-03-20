nick.addEventListener('click', () => {
  anime({
    targets: nick,
    translateY: 50,
    opacity: 0,
    duration: 1000,
    easing: 'easeOutExpo'
  });
});