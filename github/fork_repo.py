import requests
import json
import time
import random, string;

# This function makes a default branch.
def wait_for_default_branch(token, owner, repo_name, branch="main", timeout=15):
    url = f"https://api.github.com/repos/{owner}/{repo_name}/git/ref/heads/{branch}"
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github+json"
    }

    print(f"⏳ Waiting for {branch} branch to be ready...")
    for i in range(timeout):
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            print("✅ Branch is ready.")
            return True
        time.sleep(4)

    print("❌ Timed out waiting for branch to initialize.")
    return False

## After we have a default branch, we can create a branch for our user.
def create_branch_from_main(token, repo_owner, repo_name, new_branch_name, base_branch="main", timeout=20):
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github+json"
    }

    ref_url = f"https://api.github.com/repos/{repo_owner}/{repo_name}/git/ref/heads/{base_branch}"
    commit_url_template = f"https://api.github.com/repos/{repo_owner}/{repo_name}/git/commits/"

    # Retry logic for SHA and commit readiness
    sha = None
    for attempt in range(timeout):
        ref_response = requests.get(ref_url, headers=headers)
        if ref_response.status_code == 200:
            sha = ref_response.json()["object"]["sha"]

            # Now check if the commit for this SHA is available
            commit_response = requests.get(commit_url_template + sha, headers=headers)
            if commit_response.status_code == 200:
                print(f"✅ Base branch '{base_branch}' SHA is ready: {sha}")
                break
            else:
                print(f"⏳ Waiting for commit object for SHA {sha} to be ready...")
        else:
            print(f"⏳ Waiting for base branch '{base_branch}' to be ready...")

        time.sleep(2)

    if not sha:
        print("❌ Failed to retrieve base branch SHA after waiting.")
        return

    # Step 2: Create new branch from that SHA
    new_ref_url = f"https://api.github.com/repos/{repo_owner}/{repo_name}/git/refs"
    payload = {
        "ref": f"refs/heads/{new_branch_name}",
        "sha": sha
    }

    create_response = requests.post(new_ref_url, headers=headers, json=payload)

    if create_response.status_code == 201:
        print(f"✅ Branch '{new_branch_name}' created successfully.")
    else:
        print(f"❌ Failed to create branch '{new_branch_name}': {create_response.status_code}")
        print(create_response.json())

## This function takes the new repo and addes a collaborator to it.
def add_collaborator_to_repo(token, repo_owner, repo_name,collaborator_username, permissions="push"):
    url = f"https://api.github.com/repos/{repo_owner}/{repo_name}/collaborators/{collaborator_username}"

    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github+json"
    }

    payload = {
        "permission": permissions
    }

    print(f"👥 Inviting {collaborator_username} to {repo_owner}/{repo_name} with {permissions} permission...")
    response = requests.put(url, headers=headers, json=payload)
    if response.status_code in [201, 204]:
        print(f" {collaborator_username} invited successfully.")
        ## If adding the collaborator was successful, we are going to wait for a default branch.
        if wait_for_default_branch(token, repo_owner, repo_name, "main"):
            create_branch_from_main(token, repo_owner, repo_name, "branch-<student>", base_branch="main")
        
    else:
        print(f"Failed to invite {collaborator_username}. Status {response.status_code}")
        print(response.json())


def create_repo_name(new_repo_name):
    repo_name = new_repo_name+ '_'+''.join(random.choices(string.ascii_lowercase, k=5))

    return repo_name


## This function takes in a template repo, as well as a new repo name
## as well as the 
def create_repo_from_template(token, template_owner, template_repo, 
                              new_repo_name, your_username, colab_username,private=True):
    ## url to generate the repo.
    url = f"https://api.github.com/repos/{template_owner}/{template_repo}/generate"
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github+json"
    }
    student_repo_links = []
    for students in colab_username:
        print(students)
        newer_repo_name = create_repo_name(new_repo_name)
        ##TODO: create a random string of characters new repo name.
        payload = {
            "owner": your_username,
            "name": newer_repo_name,
            "private": private,
            "include_all_branches": False
        }
        print(f"📦 Creating repo '{newer_repo_name}' from template '{template_owner}/{template_repo}'...")
        ## sends a post request to github to create the repo.
        response = requests.post(url, headers=headers, data=json.dumps(payload))
        if response.status_code == 201:
            print(f"Repo created: https://github.com/{your_username}/{newer_repo_name}")

            ## This is where we add the collaborators to the repo.
            add_collaborator_to_repo(token,template_owner,newer_repo_name,students,"push")
            student_repo_links.append(f"https://github.com/{your_username}/{newer_repo_name}")
            
        else:
            print("Failed to create repo from template:")
            print("Status Code:", response.status_code)
            print(response.json())
            return None
        