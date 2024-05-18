const express = require('express');
const { BlobServiceClient } = require('@azure/storage-blob');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const multer = require('multer');

const connStr = "...";
const blobServiceClient = BlobServiceClient.fromConnectionString(connStr);
const containerName = "labs";
const containerClient = blobServiceClient.getContainerClient(containerName);

const app = express();
const PORT = 3000;

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

async function setBlobMetadata(blobClient, metadata) {
    console.log(metadata);
    await blobClient.setMetadata(metadata);
    console.log(`metadata set successfully`);
}

app.get('/files', async (req, res) => {
    try {
        let blobs = [];
        for await (const blob of containerClient.listBlobsFlat()) {
            const item = containerClient.getBlockBlobClient(blob.name);
            blobs.push({
                name: blob.name,
                url: item.url
            });
        }
        res.status(200).json(blobs);
    } catch (error) {
        res.status(500).json({ message: 'Failed to list files', error: error.message });
    }
});

app.get('/file/:blobName', async (req, res) => {
    try {
        const blobName = req.params.blobName; // Get the blob name from the URL parameter

        // Get a reference to the blob
        const blobClient = containerClient.getBlobClient(blobName);
        const downloadBlockBlobResponse = await blobClient.download(0);

        // Set the appropriate content type for the image
        const contentType = downloadBlockBlobResponse.contentType || 'application/octet-stream';
        res.setHeader('Content-Type', contentType);

        // Stream the image data to the response
        downloadBlockBlobResponse.readableStreamBody.pipe(res);
    } catch (error) {
        console.error("Error downloading blob:", error);
        res.status(500).send("Error downloading image.");
    }
});

app.post('/upload', upload.single('image'), async (req, res) => {
    try {
        const id = uuidv4()
        const blockBlobClient = containerClient.getBlockBlobClient(id);
        const upload_result = await blockBlobClient.upload(req.file.buffer, req.file.size);
        res.status(200).json({
            message: 'File uploaded successfully',
            date: upload_result.date,
            id: id
        });
    } catch (error) {
        res.status(500).json({ message: 'File upload failed', error: error.message });
    }
});

app.get('/files/snapshot/:id', async (req, res) => {
    try {
        const blobName = req.params.id;
        const blobClient = containerClient.getBlobClient(blobName);
        const snapshotResponse = await blobClient.createSnapshot();
        console.log(snapshotResponse)
        res.status(200).json({ message: `Snapshot created successfully. Snapshot URL: ${snapshotResponse.snapshot}`});
    } catch (error) {
        res.status(500).json({ message: 'Failed to create file snapshot', error: error.message });
    }
});

app.get('/files/copy/:id', async (req, res) => {
    try {
        const sourceBlobName = req.params.id;
        const destinationBlobName = uuidv4()

        const sourceBlobClient = containerClient.getBlobClient(sourceBlobName);
        const destinationBlobClient = containerClient.getBlobClient(destinationBlobName);
        const copyResponse = await destinationBlobClient.beginCopyFromURL(sourceBlobClient.url);
        await copyResponse.pollUntilDone();
        res.status(200).json({ message: `File successfully copied`, id:  destinationBlobName });
    } catch (error) {
        res.status(500).json({ message: 'Failed to copy file', error: error.message });
    }
});

app.delete('/files/:blobName', async (req, res) => {
    try {
        const blobName = req.params.blobName;
        const blobClient = containerClient.getBlobClient(blobName);
        // const blobSnapshots = await blobClient.listSnapshots();
        // const deleteSnapshotPromises = blobSnapshots
        //     .map(snapshot => blobClient.deleteSnapshot(snapshot.snapshot));

        // await Promise.all(deleteSnapshotPromises);
        await blobClient.delete();

        res.status(200).json({ message: 'File deleted successfully', id: blobName});
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete file', error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});