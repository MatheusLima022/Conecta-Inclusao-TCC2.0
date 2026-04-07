function showPopup(message, type = 'info') {
    return new Promise((resolve) => {
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'popup-modal';
        document.body.appendChild(modal);

        // Common styles
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
        modal.style.display = 'flex';
        modal.style.justifyContent = 'center';
        modal.style.alignItems = 'center';
        modal.style.zIndex = '3000';

        const content = document.createElement('div');
        content.className = 'popup-content';
        content.style.backgroundColor = 'white';
        content.style.padding = '20px';
        content.style.borderRadius = '8px';
        content.style.textAlign = 'center';
        content.style.maxWidth = '400px';
        modal.appendChild(content);

        const p = document.createElement('p');
        p.textContent = message;
        content.appendChild(p);

        if (type === 'confirm') {
            const yesBtn = document.createElement('button');
            yesBtn.className = 'popup-yes';
            yesBtn.textContent = 'Sim';
            yesBtn.style.marginTop = '10px';
            yesBtn.style.marginRight = '10px';
            yesBtn.style.padding = '10px 20px';
            yesBtn.style.border = 'none';
            yesBtn.style.backgroundColor = '#007bff';
            yesBtn.style.color = 'white';
            yesBtn.style.borderRadius = '4px';
            yesBtn.style.cursor = 'pointer';
            content.appendChild(yesBtn);

            const noBtn = document.createElement('button');
            noBtn.className = 'popup-no';
            noBtn.textContent = 'Não';
            noBtn.style.marginTop = '10px';
            noBtn.style.padding = '10px 20px';
            noBtn.style.border = 'none';
            noBtn.style.backgroundColor = '#6c757d';
            noBtn.style.color = 'white';
            noBtn.style.borderRadius = '4px';
            noBtn.style.cursor = 'pointer';
            content.appendChild(noBtn);

            yesBtn.addEventListener('click', () => {
                document.body.removeChild(modal);
                resolve(true);
            });

            noBtn.addEventListener('click', () => {
                document.body.removeChild(modal);
                resolve(false);
            });
        } else {
            const closeBtn = document.createElement('button');
            closeBtn.className = 'popup-close';
            closeBtn.textContent = 'OK';
            closeBtn.style.marginTop = '10px';
            closeBtn.style.padding = '10px 20px';
            closeBtn.style.border = 'none';
            closeBtn.style.backgroundColor = '#007bff';
            closeBtn.style.color = 'white';
            closeBtn.style.borderRadius = '4px';
            closeBtn.style.cursor = 'pointer';
            content.appendChild(closeBtn);

            closeBtn.addEventListener('click', () => {
                document.body.removeChild(modal);
                resolve();
            });
        }
    });
}