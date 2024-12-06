document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('apiForm');
    const formContainer = document.getElementById('form-container');
    const loadingContainer = document.getElementById('loading');
    const comicContainer = document.getElementById('comic-container');
    const comicBook = document.getElementById('comic-book');
    const regenerateBtn = document.getElementById('regenerate-btn');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const theEndElement = document.getElementById('the-end');

    const formSteps = document.querySelectorAll('.form-step');
    const nextBtns = document.querySelectorAll('.next-btn');
    const prevBtns = document.querySelectorAll('.prev-btn');

    let currentStep = 0;
    let currentPage = 0;
    let comicPanels = [];

    function showStep(step) {
        formSteps.forEach((formStep, index) => {
            if (index === step) {
                formStep.classList.add('active');
                setTimeout(() => {
                    formStep.style.opacity = 1;
                    formStep.style.transform = 'translateX(0)';
                }, 50);
            } else {
                formStep.classList.remove('active');
                formStep.style.opacity = 0;
                formStep.style.transform = 'translateX(50px)';
            }
        });
    }

    nextBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            currentStep++;
            showStep(currentStep);
        });
    });

    prevBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            currentStep--;
            showStep(currentStep);
        });
    });

    function showComicPanel(index) {
        if (index >= 0 && index < comicPanels.length) {
            comicBook.innerHTML = '';
            comicBook.appendChild(comicPanels[index]);
            currentPage = index;
            updatePaginationButtons();
        }
    }

    function updatePaginationButtons() {
        prevPageBtn.disabled = currentPage === 0;
        nextPageBtn.disabled = currentPage === comicPanels.length - 1;
        theEndElement.classList.toggle('hidden', currentPage !== comicPanels.length - 1);
    }

    prevPageBtn.addEventListener('click', () => {
        showComicPanel(currentPage - 1);
    });

    nextPageBtn.addEventListener('click', () => {
        showComicPanel(currentPage + 1);
    });

    form.addEventListener('submit', async function(event) {
        event.preventDefault();

        const openaiKey = document.getElementById('openaiKey').value;
        const togetherApiKey = document.getElementById('togetherApiKey').value;
        const comicIdea = document.getElementById('comicIdea').value;

        formContainer.classList.add('hidden');
        loadingContainer.classList.remove('hidden');

        try {
            const response = await fetch('https://comic-backend.priyanshideshpande19.workers.dev/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ openaiKey, togetherApiKey, comicIdea })
            });

            if (!response.ok) {
                throw new Error(await response.text());
            }

            const { images, texts } = await response.json();
            console.log('Images:', images);
            console.log('Texts:', texts);

            if (images.length === 0 || texts.length === 0) {
                throw new Error('No images or texts received.');
            }

            comicPanels = images.map((base64Image, index) => {
                const panel = document.createElement('div');
                panel.className = 'comic-panel';

                const img = document.createElement('img');
                img.src = 'data:image/png;base64,' + base64Image;
                img.alt = `Comic panel ${index + 1}`;

                const text = document.createElement('p');
                text.textContent = texts[index];

                panel.appendChild(img);
                panel.appendChild(text);
                return panel;
            });

            showComicPanel(0);
            loadingContainer.classList.add('hidden');
            comicContainer.classList.remove('hidden');
        } catch (error) {
            console.error('Error:', error);
            alert('Error: ' + error.message);
            loadingContainer.classList.add('hidden');
            formContainer.classList.remove('hidden');
        }
    });

    regenerateBtn.addEventListener('click', () => {
        comicContainer.classList.add('hidden');
        formContainer.classList.remove('hidden');
        currentStep = 0;
        showStep(currentStep);
        comicPanels = [];
        theEndElement.classList.add('hidden');
    });
});