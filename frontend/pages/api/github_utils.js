// Required libraries
const axios = require('axios');
const crypto = require('crypto');

// Generate a random repo name
function createRepoName(base) {
    const suffix = crypto.randomBytes(3).toString('hex');
    return `${base}_${suffix}`;
}

// Wait until the default branch is ready (checks both ref and commit)
async function waitForDefaultBranch(token, owner, repo, branch = 'main', timeout = 15) {
    const headers = {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github+json'
    };

    const refUrl = `https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${branch}`;
    const commitUrl = `https://api.github.com/repos/${owner}/${repo}/git/commits/`;

    console.log(`⏳ Waiting for ${branch} branch and its commit to be ready...`);

    for (let i = 0; i < timeout; i++) {
        try {
            const refRes = await axios.get(refUrl, { headers });
            const sha = refRes.data.object.sha;

            try {
                const commitRes = await axios.get(commitUrl + sha, { headers });
                if (commitRes.status === 200) {
                    console.log("✅ Branch and commit are ready.");
                    return sha;
                }
            } catch (err) {
                console.log(`⏳ Commit ${sha} not ready yet...`);
            }
        } catch (err) {
            console.log(`⏳ Ref not ready yet...`);
        }
        await new Promise(res => setTimeout(res, 4000));
    }

    console.log("❌ Timed out waiting for branch/commit to initialize.");
    return null;
}

// Create branch from main
async function createBranchFromMain(token, owner, repo, newBranch, baseSha) {
    const headers = {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github+json'
    };

    const payload = {
        ref: `refs/heads/${newBranch}`,
        sha: baseSha
    };
    const url = `https://api.github.com/repos/${owner}/${repo}/git/refs`;

    try {
        const response = await axios.post(url, payload, { headers });
        if (response.status === 201) {
            console.log(`✅ Branch '${newBranch}' created successfully.`);
        }
    } catch (err) {
        console.error(`❌ Failed to create branch '${newBranch}':`, err.response?.data || err.message);
    }
}

// Invite collaborator
async function addCollaboratorToRepo(token, owner, repo, username, baseSha, permission = 'push') {
    const url = `https://api.github.com/repos/${owner}/${repo}/collaborators/${username}`;
    const headers = {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github+json'
    };
    const payload = { permission };

    console.log(`👥 Inviting ${username} to ${owner}/${repo} with ${permission} permission...`);
    try {
        const res = await axios.put(url, payload, { headers });
        if ([201, 204].includes(res.status)) {
            console.log(`✅ ${username} invited successfully.`);
            await createBranchFromMain(token, owner, repo, `branch-${username}`, baseSha);
        }
    } catch (err) {
        console.error("❌ Failed to invite collaborator:", err.response?.data || err.message);
    }
}

// Create repo from template and process students
async function createReposFromTemplate(token, templateOwner, templateRepo, baseRepoName, yourUsername, studentList) {
    const headers = {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github+json'
    };

    const url = `https://api.github.com/repos/${templateOwner}/${templateRepo}/generate`;
    const links = [];

    for (const student of studentList) {
        const repoName = createRepoName(baseRepoName);
        const payload = {
            owner: yourUsername,
            name: repoName,
            private: true,
            include_all_branches: false
        };

        console.log(`📦 Creating repo '${repoName}' from template '${templateOwner}/${templateRepo}'...`);
        try {
            const response = await axios.post(url, payload, { headers });
            if (response.status === 201) {
                console.log(`✅ Repo created: https://github.com/${yourUsername}/${repoName}`);

                const sha = await waitForDefaultBranch(token, yourUsername, repoName);
                if (sha) {
                    await addCollaboratorToRepo(token, yourUsername, repoName, student, sha);
                    links.push(`https://github.com/${yourUsername}/${repoName}`);
                }
            }
        } catch (err) {
            console.error("❌ Failed to create repo:", err.response?.data || err.message);
        }
    }

    return links;
}

module.exports = {
    createReposFromTemplate
};