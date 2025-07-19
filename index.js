const { createReposFromTemplate } = require('./github/github_utils');
const config = require('./github/config.json');

(async () => {
    const { token, templateOwner, templateRepo, username, students } = config;
    const baseRepoName = "assignment";

    const links = await createReposFromTemplate(token, templateOwner, templateRepo, baseRepoName, username, students);
    console.log("All student repos created:");
    console.log(links);
})();