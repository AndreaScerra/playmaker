const dropArea = document.getElementById('drop-area');
const fileInput = document.getElementById('file-input');
const previewContainer = document.getElementById('preview-container');
let imageFiles = [];

fileInput.addEventListener('change', handleFiles);


dropArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropArea.style.backgroundColor = '#333';
});

dropArea.addEventListener('dragleave', () => {
    dropArea.style.backgroundColor = '#1a1a1a';
});

dropArea.addEventListener('drop', (e) => {
    e.preventDefault();
    dropArea.style.backgroundColor = '#1a1a1a';
    handleFiles(e.dataTransfer.files);
});

fileInput.addEventListener('change', () => {
    handleFiles(fileInput.files);
});

function handleFiles(files) {
    Array.from(files).forEach(file => {
        if (file.type.startsWith('image/png')) {
            const reader = new FileReader();
            reader.onload = () => {
                file._dataUrl = reader.result; // ✅ salva direttamente nel file
                imageFiles.push(file);
                displayPreview(file);
            };
            reader.readAsDataURL(file);
        }
    });
}


// Mostra anteprima
function displayPreview(file) {
    const container = document.createElement('div');
    container.classList.add('img-container');
    container.dataset.filename = file.name;
    container.dataset.dataurl = file._dataUrl; // ✅ Salviamo il base64

    const img = document.createElement('img');
    img.src = file._dataUrl;
    img.classList.add('preview-image');

    const deleteButton = document.createElement('button');
    deleteButton.innerHTML = '&times;';
    deleteButton.classList.add('delete-button');
    deleteButton.onclick = () => {
        container.remove();
        imageFiles = imageFiles.filter(f => f.name !== file.name);
    };

    container.appendChild(img);
    container.appendChild(deleteButton);
    previewContainer.appendChild(container);
}




document.getElementById('reset-button').addEventListener('click', () => {
    imageFiles = [];
    previewContainer.innerHTML = '';
    fileInput.value = '';
});

// Modifica la funzione `generate-pdf` per utilizzare l'ordine aggiornato
document.getElementById('generate-pdf').addEventListener('click', async () => {
    if (imageFiles.length === 0) {
        alert('Per favore, seleziona almeno un file PNG.');
        return;
    }

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = 80;
    const imgHeight = 64;
    const sideMargin = 17.5;
    const topMargin = 33.5;
    const spaceBetweenX = 15;
    const spaceBetweenY = 20;

    const logoUrl = 'https://raw.githubusercontent.com/AndreaScerra/playmaker/refs/heads/main/png-to-pdf/img/logopdf.png';
    const logoWidth = 15.34;
    const logoHeight = 15.34;
    const logoX = pageWidth - logoWidth - 9.7;
    const logoY = 9;

    const rowPositions = [
        topMargin,
        topMargin + imgHeight + spaceBetweenY,
        topMargin + (imgHeight + spaceBetweenY) * 2
    ];

    for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const img = new Image();
        img.src = file._dataUrl; // Usa il base64 salvato per evitare problemi di ordine
        await new Promise(resolve => img.onload = resolve);

        const col = i % 2;
        const row = Math.floor((i % 6) / 2);
        const x = sideMargin + col * (imgWidth + spaceBetweenX);
        const y = rowPositions[row];

        pdf.setDrawColor(0);
        pdf.setLineWidth(1);
        pdf.rect(x - 1, y - 1, imgWidth + 2, imgHeight + 2, 'S');
        pdf.addImage(img, 'PNG', x, y, imgWidth, imgHeight);

        if (i % 6 === 0) {
            const logoImg = new Image();
            logoImg.src = logoUrl;
            await new Promise(resolve => logoImg.onload = resolve);
            pdf.addImage(logoImg, 'PNG', logoX, logoY, logoWidth, logoHeight);
        }

        if ((i + 1) % 6 === 0 && i !== imageFiles.length - 1) {
            pdf.addPage();
        }
    }

    pdf.save('playbook.pdf');
});

Sortable.create(previewContainer, {
    animation: 150,
    onEnd: () => {
        console.log("Drag terminato, aggiornamento ordine..."); 
        const previews = previewContainer.querySelectorAll('.img-container');
        const newImageFiles = [];

        previews.forEach(container => {
            const filename = container.dataset.filename;
            const matched = imageFiles.find(file => file.name === filename);
            if (matched) newImageFiles.push(matched);
        });

        imageFiles = newImageFiles;
    }
});

document.getElementById('gopl').addEventListener('click', () => {
    window.location.href = '../playmaker/index.html';
});
