document.addEventListener("DOMContentLoaded", function () {
    const createProjectBtn = document.getElementById("createProjectBtn");
    const projectForm = document.getElementById("projectForm");
    const cancelForm = document.getElementById("cancelForm");
    const newProjectForm = document.getElementById("newProjectForm");
    const projectList = document.getElementById("projectList");
    const signOutButton = document.getElementById("signOutButton");

    const API_URL = "https://your-api-id.execute-api.ca-central-1.amazonaws.com/projects"; // Replace with your API Gateway URL

    // ✅ Check if the user is authenticated before accessing the page
    function checkAuthentication() {
        const token = localStorage.getItem("cognitoIdToken");
        if (!token) {
            alert("You must be signed in to access this page.");
            window.location.href = "signin.html";
        }
    }

    // ✅ Get Cognito authentication token and user ID
    function getAuthToken() {
        return localStorage.getItem("cognitoIdToken"); // Get ID token from storage
    }

    function getUserId() {
        return localStorage.getItem("cognitoUserId"); // User's Cognito ID (sub)
    }

    // ✅ Load only the projects for the authenticated user
    async function loadProjects() {
        try {
            const token = getAuthToken();
            if (!token) {
                console.error("No authentication token found.");
                return;
            }

            const response = await fetch(API_URL, {
                method: "GET",
                headers: {
                    "Authorization": token, // Send token to API Gateway
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
            alert("Failed to load projects.");
        }
    }

    // ✅ Handle form submission
    newProjectForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const projectName = document.getElementById("projectName").value;
        const projectAddress = document.getElementById("projectAddress").value;
        const projectType = document.getElementById("projectType").value;
        const userId = getUserId(); // Get the Cognito user ID

        if (!projectName || !projectAddress) {
            alert("Please fill in all fields.");
            return;
        }

        const projectData = {
            userId, // Include userId to associate the project with the logged-in user
            name: projectName,
            address: projectAddress,
            type: projectType
        };

        try {
            const token = getAuthToken();
            const response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Authorization": token, // Send token to API
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(projectData),
            });

            if (response.ok) {
                alert("Project created successfully!");
                newProjectForm.reset();
                projectForm.style.display = "none";
                loadProjects(); // Refresh project list
            } else {
                const errorData = await response.json();
                alert("Error: " + errorData.message);
            }
        } catch (error) {
            console.error("Error saving project:", error);
            alert("Failed to save project.");
        }
    });

    // ✅ Handle sign out
    signOutButton.addEventListener("click", function () {
        localStorage.removeItem("cognitoIdToken");
        localStorage.removeItem("cognitoUserId");
        window.location.href = "signin.html";
    });

    // ✅ Enforce authentication and load projects
    checkAuthentication();
    loadProjects();
});
