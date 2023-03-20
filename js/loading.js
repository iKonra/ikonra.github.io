var loadingScreen = document.querySelector('.loading-screen');

        loadingScreen.addEventListener('transitionend', function() {
          loadingScreen.style.display = 'none';
        });
        
        setTimeout(function(){
          loadingScreen.classList.add('fade-out');
        }, 4000);

        setTimeout(function() {
            var backgroundContainer = document.querySelector('.background-container');
            backgroundContainer.style.display = 'block';
          }, 4000);