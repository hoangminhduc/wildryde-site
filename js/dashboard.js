document.addEventListener("DOMContentLoaded", function () {
    const createProjectBtn = document.getElementById("createProjectBtn");
    const projectForm = document.getElementById("projectForm");
    const cancelForm = document.getElementById("cancelForm");
    const newProjectForm = document.getElementById("newProjectForm");
    const projectList = document.getElementById("projectList");
    const signOutButton = document.getElementById("signOutButton");

    const API_URL = "https://your-api-id.execute-api.ca-central-1.amazonaws.com/projects"; // Replace with your API Gateway URL

    // Get the Cognito authentication token
    function getAuthToken() {
        return localStorage.getItem("cognitoIdToken"); // Store this when the user logs in
    }

    // Load projects from API (Authenticated)
    async function loadProjects() {
        try {
            const token = getAuthToken();
            const response = await fetch(API_URL, {
                method: "GET",
                headers: {
                    "Authorization": token, // Send token to API
                    "Content-Type": "application/json",
                },
            });

            const projects = await response.json();
            projectList.innerHTML = "";

            projects.forEach((project) => {
                const li = document.createElement("li");
                li.textContent = `${project.name} - ${project.type}`;
                projectList.appendChild(li);
            });
        } catch (error) {
            console.error("Error loading projects:", error);
        }
    }

    // Handle form submission
    newProjectForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const projectName = document.getElementById("projectName").value;
        const projectAddress = document.getElementById("projectAddress").value;
        const projectType = document.getElementById("projectType").value;

        if (!projectName || !projectAddress) {
            alert("Please fill in all fields.");
            return;
        }

        const projectData = {
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

    // Handle sign out
    signOutButton.addEventListener("click", function () {
        localStorage.removeItem("cognitoIdToken");
        window.location.href = "signin.html";
    });

    // Load projects on page load
    loadProjects();
});
