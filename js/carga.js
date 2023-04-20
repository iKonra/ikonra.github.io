var loadingScreen = document.querySelector('.loading-screen');
    var nick = document.getElementById('nick');
    var restOfElements = Array.from(document.querySelectorAll('.background-container .redes, .background-container .stats-container, #generate-stars-btn, .donate-containe, #donate '));

    loadingScreen.addEventListener('transitionend', function() {
        loadingScreen.style.opacity = '0';
        nick.style.opacity = '1';
        setTimeout(function(){
            restOfElements.forEach(function(element) {
                anime({
                    targets: element,
                    opacity: 1,
                    duration: 500,
                    easing: 'easeOutSine'
                });
            });
        }, 1000);
    });
    
    setTimeout(function(){
        loadingScreen.classList.add('fade-out');
    }, 4000);