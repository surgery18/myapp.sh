fetch("projects.json")
  .then((response) => response.json())
  .then((projects) => {
    const projectsElement = document.getElementById("projects")

    projects.forEach(async (project) => {
      // Use async here as we'll await fetching description
      const projectElement = document.createElement("div")
      projectElement.className = "project"

      const projectName = document.createElement("h3")
      projectName.textContent = project.name

      let projectDescriptionText = project.description || "Loading..." // Default to "Loading..."

      const projectDescription = document.createElement("p")
      projectDescription.textContent = projectDescriptionText

      // Check if the URL is defined or not empty, otherwise use the default structure
      const projectURL =
        project.url && project.url.trim() !== ""
          ? project.url
          : `https://${project.name}.myapp.sh`

      const projectLink = document.createElement("button")
      projectLink.className = "button button-primary"
      projectLink.onclick = () => window.open(projectURL, "_blank")
      projectLink.textContent = "View Project"

      const codeURL = `https://github.com/surgery18/${project.name}`
      const codeLink = document.createElement("button")
      codeLink.className = "button button-success"
      codeLink.onclick = () => window.open(codeURL, "_blank")
      codeLink.textContent = "View Code"

      const buttonGroup = document.createElement("div")
      buttonGroup.className = "button-group"
      buttonGroup.appendChild(projectLink)
      buttonGroup.appendChild(codeLink)

      projectElement.appendChild(projectName)
      projectElement.appendChild(projectDescription)
      projectElement.appendChild(buttonGroup)

      projectsElement.appendChild(projectElement)

      // If the description is "Loading...", fetch from GitHub
      if (projectDescriptionText === "Loading...") {
        try {
          const repoResponse = await fetch(
            `https://api.github.com/repos/surgery18/${project.name}`
          )
          const repoData = await repoResponse.json()
          projectDescription.textContent =
            repoData.description || "No description available."
        } catch (error) {
          console.error(
            "Error fetching description from GitHub for",
            project.name,
            ":",
            error
          )
          projectDescription.textContent = "Error loading description."
        }
      }
    })
  })
  .catch((error) => {
    console.error("Error fetching projects:", error)
  })

document.getElementById(
  "copyright-year"
).textContent = new Date().getFullYear()
