// Fetch and display GitHub projects
fetch("projects.json")
	.then((response) => response.json())
	.then((projects) => {
		const projectsElement = document.getElementById("projects")

		projects.forEach(async (project) => {
			const projectElement = document.createElement("div")
			projectElement.className = "project"

			const projectName = document.createElement("h3")
			projectName.textContent = project.name

			let projectDescriptionText = project.description || "Loading..."

			const projectDescription = document.createElement("p")
			projectDescription.textContent = projectDescriptionText

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

			// Fetch description from GitHub if not provided
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

// Fetch and display non-GitHub projects
fetch("non_gh_projects.json")
	.then((response) => response.json())
	.then((projects) => {
		const projectsElement = document.getElementById("non-gh-projects")

		for (const project of projects) {
			const projectElement = document.createElement("div")
			projectElement.className = "project"

			const projectName = document.createElement("h3")
			projectName.textContent = project.name

			const projectDescription = document.createElement("p")
			projectDescription.textContent = project.description

			const projectURL =
				project.url && project.url.trim() !== ""
					? project.url
					: `${project.name}.myapp.sh`

			const projectLink = document.createElement("button")
			projectLink.className = "button button-primary"
			projectLink.onclick = () => window.open(projectURL, "_blank")
			projectLink.textContent = "View Project"

			projectElement.appendChild(projectName)
			projectElement.appendChild(projectDescription)
			projectElement.appendChild(projectLink)

			projectsElement.appendChild(projectElement)
		}
	})
	.catch((error) => {
		console.error("Error fetching non-GitHub projects:", error)
	})

// Fetch and display videos
fetch("videos.json")
	.then((response) => response.json())
	.then((videos) => {
		const videosElement = document.getElementById("videos")

		videos.forEach((video) => {
			const videoElement = document.createElement("div")
			videoElement.className = "video"

			const videoTitle = document.createElement("h3")
			videoTitle.textContent = video.title
			videoElement.appendChild(videoTitle)

			if (video.description) {
				const videoDescription = document.createElement("p")
				videoDescription.textContent = video.description
				videoElement.appendChild(videoDescription)
			}

			const youtubeRegex =
				/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/

			const match = video.url.match(youtubeRegex)
			if (match && match[1]) {
				// It's a YouTube URL
				const videoId = match[1]
				const embedUrl = `https://www.youtube.com/embed/${videoId}`

				const iframe = document.createElement("iframe")
				iframe.src = embedUrl
				iframe.width = "560"
				iframe.height = "315"
				iframe.frameBorder = "0"
				iframe.allow =
					"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
				iframe.allowFullscreen = true

				videoElement.appendChild(iframe)
			} else {
				// Not a YouTube URL, use <video> tag
				const videoTag = document.createElement("video")
				videoTag.controls = true
				videoTag.width = 560
				videoTag.height = 315

				const source = document.createElement("source")
				source.src = video.url
				source.type = video.type || "video/mp4" // Default to mp4 if type not specified

				videoTag.appendChild(source)
				videoElement.appendChild(videoTag)
			}

			videosElement.appendChild(videoElement)
		})
	})
	.catch((error) => {
		console.error("Error fetching videos:", error)
	})

// Update copyright year
document.getElementById("copyright-year").textContent = new Date().getFullYear()
