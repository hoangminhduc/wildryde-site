document.addEventListener("DOMContentLoaded", async function () {
    const createProjectBtn = document.getElementById("createProjectBtn");
    const projectForm = document.getElementById("projectForm");
    const cancelForm = document.getElementById("cancelForm");
    const newProjectForm = document.getElementById("newProjectForm");
    const projectList = document.getElementById("projectList");
    const signOutButton = document.getElementById("signOutButton");

    const API_URL = "https://nns528n8ac.execute-api.ca-central-1.amazonaws.com/dev/SaveProject"; // Replace with actual API URL

    // ✅ Initialize Cognito User Pool
    const userPool = new AmazonCognitoIdentity.CognitoUserPool({
        UserPoolId: window._config.cognito.userPoolId,
        ClientId: window._config.cognito.userPoolClientId,
    });

    // ✅ Ensure required elements exist
    if (!createProjectBtn || !projectForm || !cancelForm || !newProjectForm) {
        console.error("One or more form elements not found in the DOM.");
        return;
    }

    // ✅ Show project form on "+ Create Project" click
    createProjectBtn.addEventListener("click", function () {
        projectForm.style.display = "block"; 
    });

    // ✅ Hide form on "Cancel" click
    cancelForm.addEventListener("click", function () {
        projectForm.style.display = "none"; 
    });

    // ✅ Check if the user is authenticated before loading dashboard
    function checkAuthentication() {
        return new Promise((resolve, reject) => {
            const cognitoUser = userPool.getCurrentUser();
            if (!cognitoUser) {
                alert("You must be signed in to access this page.");
                window.location.href = "signin.html"; 
                reject("User not authenticated.");
            } else {
                cognitoUser.getSession((err, session) => {
                    if (err || !session.isValid()) {
                        alert("Session expired. Please sign in again.");
                        window.location.href = "signin.html";
                        reject("Invalid session.");
                    } else {
                        localStorage.setItem("cognitoIdToken", session.getIdToken().getJwtToken());
                        localStorage.setItem("cognitoUserId", session.getIdToken().payload.sub);
                        resolve();
                    }
                });
            }
        });
    }

    // ✅ Get authentication token
    function getAuthToken() {
        return localStorage.getItem("cognitoIdToken"); 
    }

    // ✅ Get user ID
    function getUserId() {
        return localStorage.getItem("cognitoUserId"); 
    }

    // ✅ Load authenticated user's projects
    async function loadProjects() {
        try {
            const token = getAuthToken();
            if (!token) {
                console.error("No authentication token found.");
                return;
            }

            projectList.innerHTML = "<p>Loading projects...</p>"; 

            const response = await fetch(API_URL, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`, 
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch projects");
            }

            const projects = await response.json();
            projectList.innerHTML = ""; 

            projects.forEach((project) => {
                const li = document.createElement("li");
                li.textContent = `${project.name} - ${project.type}`;
                projectList.appendChild(li);
            });
        } catch (error) {
            console.error("Error loading projects:", error);
            projectList.innerHTML = "<p>Failed to load projects.</p>"; 
        }
    }

    // ✅ Handle new project submission
    newProjectForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const projectName = document.getElementById("projectName").value.trim();
        const projectAddress = document.getElementById("projectAddress").value.trim();
        const projectType = document.getElementById("projectType").value;
        const userId = getUserId(); 

        if (!projectName || !projectAddress) {
            alert("Please fill in all fields.");
            return;
        }

        const projectData = {
            userId,
            name: projectName,
            address: projectAddress,
            type: projectType,
            createdAt: new Date().toISOString()
        };

        const submitButton = newProjectForm.querySelector(".submit-btn");
        submitButton.disabled = true;
        submitButton.textContent = "Creating...";

        try {
            const token = getAuthToken();
            console.log("Submitting project data:", projectData);

            const response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(projectData),
            });

            console.log("Response status:", response.status);

            if (!response.ok) {
                const errorData = await response.json();
                console.error("API Error:", errorData);
                alert("Error: " + (errorData.message || "Failed to save project."));
            } else {
                alert("Project created successfully!");
                newProjectForm.reset();
                projectForm.style.display = "none"; 
                await loadProjects();
            }
        } catch (error) {
            console.error("Network or server error:", error);
            alert("Failed to save project. Please check your network connection.");
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = "Create";
        }
    });

    // ✅ Handle user sign-out
    signOutButton.addEventListener("click", function () {
        const cognitoUser = userPool.getCurrentUser();
        if (cognitoUser) {
            cognitoUser.signOut();
        }

        localStorage.clear();
        sessionStorage.clear();
        window.location.href = "signin.html";
    });

    // ✅ Run authentication check and load projects if authenticated
    checkAuthentication().then(loadProjects).catch((err) => console.error(err));
});
