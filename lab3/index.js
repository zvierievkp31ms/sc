const express = require('express');
const { TableClient, AzureNamedKeyCredential } = require("@azure/data-tables");
const path = require('path');

const tableName = "chat";
const AccountName="labskpisupcomp"
const AccountKey="...";

const credential = new AzureNamedKeyCredential(AccountName, AccountKey);
const tableClient = new TableClient(`https://${AccountName}.table.core.windows.net`, tableName, credential);

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use(express.json());

app.post('/chat', async (req, res) => {
  const { author, message } = req.body;

  if (!author || !message) {
    return res.status(400).send('Author and message are required');
  }

  const entity = {
    partitionKey: 'chat',
    rowKey: new Date().getTime().toString(),
    author,
    message,
  };

  try {
    await tableClient.createEntity(entity);
    res.status(201).send('Message saved');
  } catch (error) {
    console.error(`Error saving message: ${error.message}`);
    res.status(500).send('Error saving message');
  }
});

app.get('/chat', async (req, res) => {
    const messages = [];

    try {
        const entities = tableClient.listEntities();

        for await (const entity of entities) {
            messages.push({
                author: entity.author,
                message: entity.message,
                timestamp: entity.timestamp
            });
        }
        messages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        res.status(200).json(messages);
    } catch (error) {
        console.error(`Error retrieving messages: ${error.message}`);
        res.status(500).send('Error retrieving messages');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});