import { createReposFromTemplate } from './githubRepoUtils';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Only POST requests allowed' });
    }

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
        return res.status(200).json({ message: 'Repos created', links });
    } catch (error) {
        console.error("Error in repo creation:", error);
        return res.status(500).json({ message: 'Internal Server Error', error });
    }
}