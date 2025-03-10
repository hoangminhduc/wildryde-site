document.addEventListener("DOMContentLoaded", async function () {
    const createProjectBtn = document.getElementById("createProjectBtn");
    const projectForm = document.getElementById("projectForm");
    const cancelForm = document.getElementById("cancelForm");
    const newProjectForm = document.getElementById("newProjectForm");
    const projectTableBody = document.getElementById("projectTableBody");
    const signOutButton = document.getElementById("signOutButton");

    const API_URL_GET = "https://nns528n8ac.execute-api.ca-central-1.amazonaws.com/dev/GetUserProjects"; 
    const API_URL_POST = "https://nns528n8ac.execute-api.ca-central-1.amazonaws.com/dev/SaveProject"; 

    // ✅ Ensure authentication before accessing the dashboard
    function checkAuthentication() {
        return new Promise((resolve, reject) => {
            const token = localStorage.getItem("cognitoIdToken");
            const userId = localStorage.getItem("cognitoUserId");

            if (!token || !userId) {
                console.error("User not authenticated.");
                alert("You must be signed in to access this page.");
                window.location.href = "signin.html"; 
                reject("No authenticated user.");
            } else {
                console.log("User authenticated successfully.");
                resolve();
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

    // ✅ Load projects assigned to the authenticated user
    async function loadProjects() {
        try {
            const token = getAuthToken();
            if (!token) {
                console.error("No authentication token found.");
                return;
            }

            projectTableBody.innerHTML = "<tr><td colspan='2'>Loading projects...</td></tr>";

            const response = await fetch(API_URL_GET, {
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
            projectTableBody.innerHTML = ""; 

            if (projects.length === 0) {
                projectTableBody.innerHTML = "<tr><td colspan='2'>No projects found.</td></tr>";
                return;
            }

            // Loop through projects and add them to the table
            projects.forEach((project) => {
                const row = document.createElement("tr");

                const nameCell = document.createElement("td");
                nameCell.textContent = project.name || "N/A";
                row.appendChild(nameCell);

                const addressCell = document.createElement("td");
                addressCell.textContent = project.address || "N/A";
                row.appendChild(addressCell);

                projectTableBody.appendChild(row);
            });

            console.log("Projects displayed successfully!");

        } catch (error) {
            console.error("Error loading projects:", error);
            projectTableBody.innerHTML = "<tr><td colspan='2'>Failed to load projects.</td></tr>";
        }
    }

    // ✅ Show the project form when clicking "+ Create Project"
    createProjectBtn.addEventListener("click", function () {
        projectForm.style.display = "block";
    });

    // ✅ Hide the form when clicking "Cancel"
    cancelForm.addEventListener("click", function () {
        projectForm.style.display = "none";
    });

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

            const response = await fetch(API_URL_POST, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(projectData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("API Error:", errorData);
                alert("Error: " + (errorData.message || "Failed to save project."));
            } else {
                alert("Project created successfully!");
                newProjectForm.reset();
                projectForm.style.display = "none";
                await loadProjects(); // Refresh project list
            }
        } catch (error) {
            console.error("Network or server error:", error);
            alert("Failed to save project. Please check your network connection.");
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = "Create";
        }
    });

    // ✅ Handle user sign out
    signOutButton.addEventListener("click", function () {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = "signin.html";
    });

    // ✅ Run authentication check and load projects if authenticated
    checkAuthentication().then(loadProjects).catch((err) => console.error(err));
});
