
const STORAGE_KEY = "workshop-projects-v1";
const VALID_STATUSES = ["Planned", "In Progress", "Completed"];

let projects = [];
let editingId = null;
let persistenceBlocked = false;

const projectForm = document.getElementById("project-form");
const nameInput = document.getElementById("name");
const statusInput = document.getElementById("status");
const projectList = document.getElementById("project-list");
const emptyState = document.getElementById("empty-state");
const saveButton = document.getElementById("save-button");
const cancelButton = document.getElementById("cancel-button");
const formTitle = document.getElementById("form-title");
const message = document.getElementById("message");

function setMessage(text) {
    message.textContent = text;
}

function resetForm() {
    projectForm.reset();
    editingId = null;

    saveButton.textContent = "Save Project";
    cancelButton.hidden = true;
    formTitle.textContent = "Add a Project";

    nameInput.setCustomValidity("");
    nameInput.focus();
}

function isValidProjectArray(data) {
    if (!Array.isArray(data)) {
        return false;
    }

    const ids = new Set();

    return data.every(function (project) {
        if (
            project === null ||
            typeof project !== "object" ||
            Array.isArray(project) ||
            typeof project.id !== "string" ||
            project.id.trim() === "" ||
            typeof project.name !== "string" ||
            project.name.trim() === "" ||
            project.name.length > 80 ||
            !VALID_STATUSES.includes(project.status) ||
            ids.has(project.id)
        ) {
            return false;
        }

        ids.add(project.id);
        return true;
    });
}

function loadProjects() {
    let savedText;

    try {
        savedText = localStorage.getItem(STORAGE_KEY);
    } catch (error) {
        persistenceBlocked = true;
        setMessage(
            "Projects could not be loaded from browser storage. " +
            "Changes cannot be saved safely."
        );
        return;
    }

    if (savedText === null) {
        projects = [];
        return;
    }

    try {
        const savedProjects = JSON.parse(savedText);

        if (!isValidProjectArray(savedProjects)) {
            persistenceBlocked = true;
            setMessage(
                "Saved project data is invalid. It has been left unchanged. " +
                "Changes will remain in memory and cannot be saved."
            );
            return;
        }

        projects = savedProjects;
    } catch (error) {
        persistenceBlocked = true;
        setMessage(
            "Saved project data could not be read. " +
            "It has been left unchanged, and changes cannot be saved."
        );
    }
}

function saveProjects() {
    if (persistenceBlocked) {
        setMessage(
            "Changes could not be saved. Browser storage contains " +
            "unreadable data or could not be accessed."
        );
        return false;
    }

    try {
        const savedText = JSON.stringify(projects);
        localStorage.setItem(STORAGE_KEY, savedText);
        return true;
    } catch (error) {
        setMessage(
            "Changes could not be saved to browser storage. " +
            "They are currently available only in this page."
        );
        return false;
    }
}

function renderProjects() {
    projectList.replaceChildren();

    for (const project of projects) {
        const listItem = document.createElement("li");
        const projectName = document.createElement("span");
        const projectStatus = document.createElement("span");
        const editButton = document.createElement("button");
        const deleteButton = document.createElement("button");

        projectName.textContent = project.name;
        projectStatus.textContent = ` — ${project.status}`;

        editButton.type = "button";
        editButton.textContent = "Edit";

        editButton.addEventListener("click", function () {
            editingId = project.id;

            nameInput.value = project.name;
            statusInput.value = project.status;

            saveButton.textContent = "Save changes";
            cancelButton.hidden = false;
            formTitle.textContent = "Edit Project";

            nameInput.setCustomValidity("");
            setMessage("");
            nameInput.focus();
        });

        deleteButton.type = "button";
        deleteButton.textContent = "Delete";

        deleteButton.addEventListener("click", function () {
            const confirmed = window.confirm(
                `Delete project "${project.name}"?`
            );

            if (!confirmed) {
                return;
            }

            const projectIndex = projects.findIndex(function (item) {
                return item.id === project.id;
            });

            if (projectIndex === -1) {
                return;
            }

            projects.splice(projectIndex, 1);

            if (editingId === project.id) {
                resetForm();
            }

            renderProjects();

            if (saveProjects()) {
                setMessage("Project deleted.");
            }
        });

        listItem.append(
            projectName,
            projectStatus,
            editButton,
            deleteButton
        );

        projectList.appendChild(listItem);
    }

    if (emptyState) {
        emptyState.hidden = projects.length > 0;
    }
}

projectForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const name = nameInput.value.trim();
    const status = statusInput.value;

    if (name === "") {
        nameInput.setCustomValidity("Please enter a project name.");
        nameInput.reportValidity();
        return;
    }

    nameInput.setCustomValidity("");

    if (!VALID_STATUSES.includes(status)) {
        setMessage("Please select a valid project status.");
        return;
    }

    if (editingId !== null) {
        const project = projects.find(function (item) {
            return item.id === editingId;
        });

        if (!project) {
            resetForm();
            renderProjects();
            setMessage("The project being edited could not be found.");
            return;
        }

        project.name = name;
        project.status = status;

        renderProjects();
        resetForm();

        if (saveProjects()) {
            setMessage("Project changes saved.");
        }

        return;
    }

    projects.push({
        id: crypto.randomUUID(),
        name: name,
        status: status
    });

    renderProjects();
    resetForm();

    if (saveProjects()) {
        setMessage("Project saved.");
    }
});

cancelButton.addEventListener("click", function () {
    resetForm();
    setMessage("Edit cancelled. No changes were saved.");
});

loadProjects();
renderProjects();
