function loadFiles() {
    fetch('/files')
        .then(response => response.json())
        .then(data => {
            console.log(data)

            const fileContainer = document.getElementById('files');
            fileContainer.innerHTML = '';

            data.forEach(file => {
                // const fileElement = document.createElement('div');
                // fileElement.classList.add('file-item');
                // fileElement.innerHTML = `<p>${file.name}</p>`;
                // fileContainer.appendChild(fileElement);

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><button onclick="loadBlob(this)">${file.name}</button></td>
                    <td>${file.url}</td>
                    <td><button onclick="deleteBlob(this)">Delete</button></td>
                    <td><button onclick="copyBlob(this)">Copy</button></td>
                    <td><button onclick="snapshotBlob(this)">Snapshot</button></td>
                    `;
                fileContainer.appendChild(row);
            });

        })
        .catch(error => console.error('Error fetching images:', error));
}

async function deleteBlob(fileName) {
    try {
        const response = await fetch(`files/${fileName.closest('tr').children[0].children[0].innerHTML}`, {
            method: 'DELETE',
        });
        const result = await response.json();
        if (response.ok) {
            document.getElementById('status').textContent = JSON.stringify(result);
        }
    } catch (error) {
        document.getElementById('status').textContent = error.message;
    }
    loadFiles();
}

async function copyBlob(fileName) {
    try {
        const response = await fetch(`files/copy/${fileName.closest('tr').children[0].children[0].innerHTML}`, {
            method: 'GET',
        });
        const result = await response.json();
        if (response.ok) {
            document.getElementById('status').textContent = JSON.stringify(result);
        }
    } catch (error) {
        document.getElementById('status').textContent =  error.message;
    }
    loadFiles();
}

async function snapshotBlob(fileName) {
    try {
        const response = await fetch(`files/snapshot/${fileName.closest('tr').children[0].children[0].innerHTML}`, {
            method: 'GET',
        });
        const result = await response.json();
        if (response.ok) {
            document.getElementById('status').textContent = JSON.stringify(result);
        }
    } catch (error) {
        document.getElementById('status').textContent =  error.message;
    }
    loadFiles();
}

async function loadBlob(fileName) {
    document.getElementById('blobImage').src = `/file/${fileName.closest('tr').children[0].children[0].innerHTML}`
    document.getElementById('status').textContent = 'Azure Blob Image: ' + fileName.closest('tr').children[0].children[0].innerHTML
}

document.getElementById('uploadForm').addEventListener('submit', async function (event) {
    event.preventDefault();

    const formData = new FormData();
    formData.append('image', document.getElementById('file').files[0]);

    try {
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });
        const result = await response.json();
        if (response.ok) {
            document.getElementById('status').textContent = 'Upload successful: ' + JSON.stringify(result);
        } else {
            document.getElementById('status').textContent = 'Upload failed: ' + result.message;
        }
    } catch (error) {
        document.getElementById('status').textContent = 'Upload failed: ' + error.message;
    }
    loadFiles()
});
