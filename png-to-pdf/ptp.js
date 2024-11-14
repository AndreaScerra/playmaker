document.getElementById('gopl').addEventListener('click', () => {
    window.location.href = '../playmaker/index.html';
});





document.getElementById('generate-pdf').addEventListener('click', async () => {



    const files = document.getElementById('file-input').files;
    if (files.length === 0) {
        alert('Choose one PNG');
        return;
    }

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Configurazione margini e dimensioni
    const imgWidth = 80;
    const imgHeight = 64;
    const sideMargin = 17.5; 
    const topMargin = 33.5; 
    const spaceBetweenX = 15;
    const spaceBetweenY = 20;
    
    
    // Posizione e dimensione del logo in alto a destra
    const logoUrl = 'https://raw.githubusercontent.com/AndreaScerra/playmaker/refs/heads/main/png-to-pdf/img/logopdf.png?token=GHSAT0AAAAAAC2L3TLXCSD3X52C5MDC237MZZTT42A'; 
    const logoWidth = 13;
    const logoHeight = 15.34;
    const logoX = pageWidth - logoWidth - 9.7;
    const logoY = 9;


    // Calcola le posizioni Y per le righe in base ai margini
    const rowPositions = [
        topMargin,
        topMargin + imgHeight + spaceBetweenY,
        topMargin + (imgHeight + spaceBetweenY) * 2
    ];

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const img = new Image();
        img.src = URL.createObjectURL(file);
        await new Promise(resolve => img.onload = resolve);

        // Determina colonna e riga
        const col = i % 2;
        const row = Math.floor((i % 6) / 2);
        const x = sideMargin + col * (imgWidth + spaceBetweenX);
        const y = rowPositions[row];

        // Disegna cornice e immagine
        pdf.setDrawColor(0);
        pdf.setLineWidth(1);
        pdf.rect(x - 1, y - 1, imgWidth + 2, imgHeight + 2, 'S');
        pdf.addImage(img, 'PNG', x, y, imgWidth, imgHeight);

        // Aggiungi logo in alto a destra
        if (i % 6 === 0) {
            const logoImg = new Image();
            logoImg.src = logoUrl;
            await new Promise(resolve => logoImg.onload = resolve);
            pdf.addImage(logoImg, 'PNG', logoX, logoY, logoWidth, logoHeight);
        }

        // Nuova pagina ogni 6 immagini
        if ((i + 1) % 6 === 0 && i !== files.length - 1) {
            pdf.addPage();
        }
    }

    pdf.save('playbook.pdf');
});









    //if
        //<link rel="stylesheet" href="ptp.css">
        const fileInput = document.getElementById('file-input');
        const previewContainer = document.getElementById('preview-container');
        const dragAndDropArea = document.getElementById('drag-and-drop-area');
        const modal = document.getElementById('image-modal');
        const modalImage = document.getElementById('modal-image');
        const closeModalButton = document.getElementById('close-modal');

        fileInput.addEventListener('change', handleFiles);

        dragAndDropArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            dragAndDropArea.style.backgroundColor = '#444';
        });

        dragAndDropArea.addEventListener('dragleave', () => {
            dragAndDropArea.style.backgroundColor = '#2a2a2a';
        });

        dragAndDropArea.addEventListener('drop', (e) => {
            e.preventDefault();
            dragAndDropArea.style.backgroundColor = '#2a2a2a';
            handleFiles(e.dataTransfer);
        });

        function handleFiles(event) {
            const files = event.files ? event.files : event.target.files;
            previewContainer.innerHTML = '';
            Array.from(files).forEach(file => {
                if (file.type.startsWith('image/')) {
                    const img = document.createElement('img');
                    img.src = URL.createObjectURL(file);
                    img.classList.add('preview-image');
                    img.addEventListener('click', () => openModal(img.src));
                    previewContainer.appendChild(img);
                }
            });
        }

        function openModal(imageSrc) {
            modalImage.src = imageSrc;
            modal.style.display = 'flex';
        }

        closeModalButton.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });

        document.getElementById('reset-button').addEventListener('click', () => {
            previewContainer.innerHTML = ''; // Pulisce le anteprime
            fileInput.value = ''; // Resetta l'input file
        });




        
        // Funzione per gestire il caricamento delle immagini
        fileInput.addEventListener('change', () => {
            const files = Array.from(fileInput.files);
            previewContainer.innerHTML = ''; // Pulisce le anteprime precedenti
            files.forEach(file => {
                if (file.type.startsWith('image/')) {
                    const imgContainer = document.createElement('div');
                    imgContainer.classList.add('img-container');
        
                    const img = document.createElement('img');
                    img.src = URL.createObjectURL(file);
                    img.classList.add('preview-image');
                    img.addEventListener('click', () => openModal(img.src)); // Apre la modal al click
                    
                    // Creiamo l'elemento "X" per l'eliminazione
                    const deleteButton = document.createElement('span');
                    deleteButton.innerText = '✖'; // Utilizziamo una "X"
                    deleteButton.classList.add('delete-button');
                    deleteButton.addEventListener('click', (event) => {
                        event.stopPropagation(); // Impedisce il click sull'immagine di attivare la modal
                        imgContainer.remove(); // Rimuove il contenitore dell'immagine
                        updateFileInput(file); // Aggiorna l'input file per rimuovere il file eliminato
                    });
        
                    imgContainer.appendChild(img);
                    imgContainer.appendChild(deleteButton);
                    previewContainer.appendChild(imgContainer);
                }
            });
        });
        
        // Funzione per aggiornare l'input file dopo l'eliminazione
        function updateFileInput(deletedFile) {
            const dataTransfer = new DataTransfer();
            const files = Array.from(fileInput.files);
        
            // Filtra i file per escludere quello eliminato
            const remainingFiles = files.filter(file => {
                return file.name !== deletedFile.name; // Mantieni solo i file che non sono stati eliminati
            });
        
            remainingFiles.forEach(file => dataTransfer.items.add(file));
            fileInput.files = dataTransfer.files; // Aggiorna l'input file
        }
        
        // Pulsante Reset
        document.getElementById('reset-button').addEventListener('click', () => {
            previewContainer.innerHTML = ''; // Pulisce le anteprime
            fileInput.value = ''; // Resetta l'input file
        });
        


        function uploadFilesToPreview(files) {
            // Elimina i file precedenti dall'anteprima
            previewContainer.innerHTML = '';
        
            Array.from(files).forEach(file => {
                if (file.type.startsWith('image/')) {
                    const imgContainer = document.createElement('div');
                    imgContainer.classList.add('img-container');
        
                    const img = document.createElement('img');
                    img.src = URL.createObjectURL(file);
                    img.classList.add('preview-image');
                    img.addEventListener('click', () => openModal(img.src));
        
                    const deleteButton = document.createElement('span');
                    deleteButton.innerText = '✖';
                    deleteButton.classList.add('delete-button');
                    deleteButton.addEventListener('click', (event) => {
                        event.stopPropagation();
                        imgContainer.remove();
                        updateFileInput(file);
                    });
        
                    imgContainer.appendChild(img);
                    imgContainer.appendChild(deleteButton);
                    previewContainer.appendChild(imgContainer);
                }
            });
        
            // Aggiorna `file-input` con i nuovi file
            const dataTransfer = new DataTransfer();
            files.forEach(file => dataTransfer.items.add(file));
            fileInput.files = dataTransfer.files;
        }
        
        // Simula il caricamento automatico dei file
        function simulateFileLoad(filesFromPlaymaker) {
            uploadFilesToPreview(filesFromPlaymaker);
        }
        

        dragAndDropArea.addEventListener('drop', (e) => {
            e.preventDefault();
            const files = e.dataTransfer.files;
            uploadFilesToPreview(files); 
        });
        
