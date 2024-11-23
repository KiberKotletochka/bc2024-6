const fs = require("fs");
const { program } = require('commander');
const express = require("express");
const bodyParser = require('body-parser');
const path = require('path');
const multer = require("multer");

const app = express();

program
    .requiredOption('-h, --host <host>', 'address of the server')
    .requiredOption('-p, --port <port>', 'port of the server')
    .requiredOption('-c, --cache <path>', 'path to the cache directory');

program.parse();
const { host, port, cache } = program.opts();

const upload = multer();

app.post('/write', upload.none(), (req, res) => {
    const { note_name, note } = req.body;

    if (!note_name || !note) {
        return res.status(400).send('Missing note_name or note');
    }

    const notePath = path.join(cache, note_name + '.txt');
    if (fs.existsSync(notePath)) {
        return res.status(400).send('Note already exists');
    }

    fs.writeFileSync(notePath, note);
    res.status(201).send('Note created');
});

app.get('/notes/:noteName', (req, res) => {
    const notePath = path.join(cache, req.params.noteName + '.txt');
    if (!fs.existsSync(notePath)) {
        return res.status(404).send('Not found');
    }
    const noteContent = fs.readFileSync(notePath, 'utf8');
    res.send(noteContent);
});

app.get('/notes', (req, res) => {
    const files = fs.readdirSync(cache).filter(file => file.endsWith('.txt'));
    const notes = files.map(file => {
        const noteName = path.basename(file, '.txt');
        const noteText = fs.readFileSync(path.join(cache, file), 'utf8');
        return { name: noteName, text: noteText };
    });
    res.status(200).json(notes);
});

app.delete('/notes/:noteName', (req, res) => {
    const notePath = path.join(cache, req.params.noteName + '.txt');
    if (!fs.existsSync(notePath)) {
        return res.status(404).send('Not found');
    }
    fs.unlinkSync(notePath);
    res.send('Note deleted');
});

app.put('/notes/:noteName', bodyParser.text(), (req, res) => {
    const notePath = path.join(cache, req.params.noteName + '.txt');
    if (!fs.existsSync(notePath)) {
        return res.status(404).send('Not found');
    }
    fs.writeFileSync(notePath, req.body);
    res.send('Note updated');
});

app.get("/UploadForm.html", (req, res) => {
    const filePath = path.resolve(__dirname, "UploadForm.html");
    res.sendFile(filePath);
});

app.listen(port, host, () => {
    console.log(`Server is running on http://${host}:${port}`);
});