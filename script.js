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

    let currentPage = 0;
    let comicPanels = [];

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

    form.addEventListener('submit', async function (event) {
        event.preventDefault();

        const comicIdea = document.getElementById('comicIdea').value;
        const progressBar = document.getElementById('progress-bar');
        const progressText = document.getElementById('progress-text');
        const loadingStatus = document.getElementById('loading-status');

        formContainer.classList.add('hidden');
        loadingContainer.classList.remove('hidden');

        // Reset progress
        progressBar.style.width = '0%';
        progressText.textContent = '0%';

        try {
            loadingStatus.textContent = "Crafting your story...";
            // 1. Generate Narrative using Puter.js
            // Safety: Explicitly asking for safe, all-ages content to avoid model rejections
            const systemPrompt = "You are a creative assistant generating a safe, all-ages comic book story. Create a story with 8 scenes. For each scene, provide a vivid image prompt that explicitly states 'comic book style art'. AVOID violence, blood, or copyrighted characters (like Batman). Use generic descriptions instead (e.g., 'a caped hero'). Format each scene EXACTLY as follows:\n\nImage Prompt: [Description]\nStory Text: [Text]\n\nDo not include any other text.";

            const chatResponse = await puter.ai.chat(
                `${systemPrompt}\n\nCreate an 8-scene story about: ${comicIdea}`,
                { model: 'gpt-4o-mini' }
            );

            const fullText = (chatResponse.message && chatResponse.message.content)
                ? chatResponse.message.content
                : chatResponse.toString();

            console.log("Chat Response Received:", fullText);

            const lines = fullText.split('\n').filter(line => line.trim().length > 0);

            const prompts = [];
            const texts = [];

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                if (line.toLowerCase().startsWith("image prompt:")) {
                    prompts.push(line.replace(/image prompt:/i, "").trim());
                } else if (line.toLowerCase().startsWith("story text:")) {
                    texts.push(line.replace(/story text:/i, "").trim());
                }
            }

            if (prompts.length === 0) throw new Error("Failed to parse comic prompts. Please try a different idea.");

            // 2. Generate Images using Puter.js
            const images = [];
            const panelsToGenerate = Math.min(prompts.length, 8); // Explicit 8 page limit

            for (let i = 0; i < panelsToGenerate; i++) {
                const progress = Math.round(((i) / panelsToGenerate) * 100);
                progressBar.style.width = `${progress}%`;
                progressText.textContent = `${progress}%`;
                loadingStatus.textContent = `Drawing panel ${i + 1} of ${panelsToGenerate}...`;

                try {
                    const imgResult = await puter.ai.txt2img(`${prompts[i]}, comic book style art, clean lines, vibrant`, {
                        model: 'dall-e-3',
                        provider: 'openai-image-generation'
                    });

                    const imgSrc = imgResult.src || imgResult;
                    images.push(imgSrc);
                } catch (imgError) {
                    console.error(`Failed to generate image ${i + 1}:`, imgError);
                    // Use a placeholder if safety system rejects it, so the whole comic doesn't fail
                    images.push('https://via.placeholder.com/1024x1024.png?text=Image+Safety+Restricted');
                }
            }

            // Final progress update
            progressBar.style.width = `100%`;
            progressText.textContent = `100%`;
            loadingStatus.textContent = "Assembling the book...";

            comicPanels = images.map((imgSrc, index) => {
                const panel = document.createElement('div');
                panel.className = 'comic-panel';

                const img = document.createElement('img');
                img.src = (typeof imgSrc === 'string') ? imgSrc : imgSrc.src;
                img.alt = `Comic panel ${index + 1}`;

                const text = document.createElement('p');
                text.textContent = texts[index] || "...";

                panel.appendChild(img);
                panel.appendChild(text);
                return panel;
            });

            setTimeout(() => {
                showComicPanel(0);
                loadingContainer.classList.add('hidden');
                comicContainer.classList.remove('hidden');
            }, 500);

        } catch (error) {
            console.error('Final Error Catch:', error);
            alert('Error generating comic: ' + error.message);
            loadingContainer.classList.add('hidden');
            formContainer.classList.remove('hidden');
        }
    });

    regenerateBtn.addEventListener('click', () => {
        comicContainer.classList.add('hidden');
        formContainer.classList.remove('hidden');
        comicPanels = [];
        theEndElement.classList.add('hidden');
    });
});