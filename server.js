const express = require('express');
const bodyParser = require('body-parser');
const { createReposFromTemplate } = require('./frontend/pages/api/auth/github_utils');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());

app.post('/api/auth/assign-repos', async (req, res) => {
    const {
        token,
        templateOwner,
        templateRepo,
        baseRepoName,
        yourUsername,
        studentList
    } = req.body;

    if (!token || !templateOwner || !templateRepo || !baseRepoName || !yourUsername || !studentList) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        const links = await createReposFromTemplate(
            token,
            templateOwner,
            templateRepo,
            baseRepoName,
            yourUsername,
            studentList
        );
        res.status(200).json({ message: 'Repos created', links });
    } catch (error) {
        console.error("Error in repo creation:", error);
        res.status(500).json({ message: 'Internal Server Error', error });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server listening on http://localhost:${PORT}`);
});