import json
from fork_repo import create_repo_from_template


def main():
    # Load config
    with open("config.json", "r") as f:
        config = json.load(f)

    # Extract values from config
    token = config["Personal_access_token"]
    github_username = config["Github_Username"]
    template_repo_name = config["repo_to_fork"]  # This should be JUST the repo name (not a URL)
    template_owner = config["TEMPLATE_OWNER"]
    new_repo_name = "hackthesixnewrepo"  # You can make this dynamic too

    # Debug print
    print("Token:", token)
    print("GitHub Username:", github_username)
    print("Template Repo:", template_repo_name)
    print("Template Owner:", template_owner)

    # Create new repo from template
    create_repo_from_template(
        token,
        template_owner,
        template_repo_name,
        new_repo_name,
        github_username,"utcjcao",
        private=True
    )

if __name__ == "__main__":
    main()