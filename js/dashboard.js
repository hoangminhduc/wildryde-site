document.addEventListener("DOMContentLoaded", async function () {
    const createProjectBtn = document.getElementById("createProjectBtn");
    const projectForm = document.getElementById("projectForm");
    const cancelForm = document.getElementById("cancelForm");
    const newProjectForm = document.getElementById("newProjectForm");
    const projectList = document.getElementById("projectList");
    const signOutButton = document.getElementById("signOutButton");

    const API_URL = "https://your-api-id.execute-api.ca-central-1.amazonaws.com/prod/saveProject"; // Replace with your API Gateway URL

    // ✅ Initialize Cognito User Pool
    const userPool = new AmazonCognitoIdentity.CognitoUserPool({
        UserPoolId: window._config.cognito.userPoolId,
        ClientId: window._config.cognito.userPoolClientId,
    });

    // ✅ Ensure elements exist before attaching event listeners
    if (!createProjectBtn || !projectForm || !cancelForm || !newProjectForm) {
        console.error("One or more form elements not found in the DOM.");
        return;
    }

    // ✅ Show the project form when clicking "+ Create Project"
    createProjectBtn.addEventListener("click", function () {
        projectForm.style.display = "block"; // Show form
    });

    // ✅ Hide the form when clicking "Cancel"
    cancelForm.addEventListener("click", function () {
        projectForm.style.display = "none"; // Hide form
    });

    // ✅ Check if the user is authenticated before loading the dashboard
    function checkAuthentication() {
        return new Promise((resolve, reject) => {
            const cognitoUser = userPool.getCurrentUser();
            if (!cognitoUser) {
                console.error("User not authenticated.");
                alert("You must be signed in to access this page.");
                window.location.href = "signin.html"; // Redirect to sign-in if no user found
                reject("No authenticated user.");
            } else {
                cognitoUser.getSession((err, session) => {
                    if (err || !session.isValid()) {
                        console.error("Session expired or invalid.");
                        alert("Session expired. Please sign in again.");
                        window.location.href = "signin.html";
                        reject("Invalid session.");
                    } else {
                        console.log("User authenticated successfully.");
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
        return localStorage.getItem("cognitoIdToken"); // Retrieve stored token
    }

    // ✅ Get user ID
    function getUserId() {
        return localStorage.getItem("cognitoUserId"); // Retrieve stored user ID
    }

    // ✅ Load authenticated user's projects
    async function loadProjects() {
        try {
            const token = getAuthToken();
            if (!token) {
                console.error("No authentication token found.");
                return;
            }

            projectList.innerHTML = "<p>Loading projects...</p>"; // Display loading message

            const response = await fetch(API_URL, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`, // Ensure correct token format
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch projects");
            }

            const projects = await response.json();
            projectList.innerHTML = ""; // Clear loading message

            projects.forEach((project) => {
                const li = document.createElement("li");
                li.textContent = `${project.name} - ${project.type}`;
                projectList.appendChild(li);
            });
        } catch (error) {
            console.error("Error loading projects:", error);
            projectList.innerHTML = "<p>Failed to load projects.</p>"; // Show error message
        }
    }

    // ✅ Handle new project submission
    newProjectForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const projectName = document.getElementById("projectName").value.trim();
        const projectAddress = document.getElementById("projectAddress").value.trim();
        const projectType = document.getElementById("projectType").value;
        const userId = getUserId(); // Get Cognito user ID

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

        try {
            const token = getAuthToken();
            const submitButton = newProjectForm.querySelector(".submit-btn");
            submitButton.disabled = true;
            submitButton.textContent = "Creating...";

            const response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(projectData),
            });

            if (response.ok) {
                alert("Project created successfully!");
                newProjectForm.reset();
                projectForm.style.display = "none";
                loadProjects();
            } else {
                const errorData = await response.json();
                alert("Error: " + errorData.message);
            }
        } catch (error) {
            console.error("Error saving project:", error);
            alert("Failed to save project.");
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = "Create";
        }
    });

    // ✅ Handle user sign out
    signOutButton.addEventListener("click", function () {
        const cognitoUser = userPool.getCurrentUser();

        if (cognitoUser) {
            cognitoUser.signOut();
        }

        localStorage.clear();
        sessionStorage.clear();
        window.location.href = "signin.html";
    });

    // ✅ Run authentication check and load projects only if authenticated
    checkAuthentication().then(loadProjects).catch((err) => console.error(err));
});
