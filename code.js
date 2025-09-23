const stripJsonComments = (input) => {
	let output = ""
	let insideString = false
	let insideSingleLine = false
	let insideMultiLine = false
	let escaped = false

	for (let i = 0; i < input.length; i++) {
		const current = input[i]
		const next = i + 1 < input.length ? input[i + 1] : ""

		if (insideSingleLine) {
			if (current === "\n" || current === "\r") {
				insideSingleLine = false
				output += current
			}
			continue
		}

		if (insideMultiLine) {
			if (current === "*" && next === "/") {
				insideMultiLine = false
				i++
			}
			continue
		}

		if (insideString) {
			output += current
			if (current === '"' && !escaped) {
				insideString = false
			}
			escaped = current === "\\" && !escaped
			continue
		}

		if (current === "/" && next === "/") {
			insideSingleLine = true
			i++
			continue
		}

		if (current === "/" && next === "*") {
			insideMultiLine = true
			i++
			continue
		}

		if (current === '"') {
			insideString = true
			output += current
			escaped = false
			continue
		}

		output += current
	}

	return output
}

const removeTrailingCommas = (input) => {
	let output = ""
	let insideString = false
	let escaped = false

	for (let i = 0; i < input.length; i++) {
		const current = input[i]

		if (insideString) {
			output += current
			if (current === '"' && !escaped) {
				insideString = false
			}
			escaped = current === "\\" && !escaped
			continue
		}

		if (current === '"') {
			insideString = true
			output += current
			escaped = false
			continue
		}

		if (current === ",") {
			let j = i + 1
			while (j < input.length && /\s/.test(input[j])) {
				j++
			}

			if (j < input.length && (input[j] === "}" || input[j] === "]")) {
				i = j - 1
				continue
			}
		}

		output += current
	}

	return output
}

const loadJsonc = async (url) => {
	const response = await fetch(url)
	const text = await response.text()
	const stripped = stripJsonComments(text)
	const cleaned = removeTrailingCommas(stripped)
	return JSON.parse(cleaned)
}
const filterState = {
	search: "",
	tags: new Set(),
}

const projectCards = []
const availableTags = new Map()
let chipsContainer

const normaliseTags = (rawTags) => {
	if (Array.isArray(rawTags) && rawTags.length > 0) {
		return rawTags
	}
	return ["Other"]
}

const createTagGroup = (tags) => {
	const container = document.createElement("div")
	container.className = "card-tags"

	tags.forEach((tag) => {
		const tagElement = document.createElement("span")
		tagElement.className = "card-tag"
		tagElement.textContent = tag
		container.appendChild(tagElement)
	})

	return container
}

const buildSearchIndex = (name, description, tags) =>
	(name + " " + (description || "") + " " + tags.join(" ")).toLowerCase()

const registerProjectCard = (card, tags, name, description) => {
	const lowerTags = tags.map((tag) => tag.toLowerCase())
	card.dataset.tags = lowerTags.join("|")
	card.dataset.search = buildSearchIndex(name, description, tags)
	projectCards.push(card)
	applyFilters()
}

const updateCardDescription = (card, name, description, tags) => {
	card.dataset.search = buildSearchIndex(name, description, tags)
	applyFilters()
}

const ensureTagsTracked = (tags) => {
	let changed = false
	tags.forEach((tag) => {
		const lower = tag.toLowerCase()
		if (!availableTags.has(lower)) {
			availableTags.set(lower, tag)
			changed = true
		}
	})
	if (changed) {
		renderTagChips()
	}
}

const applyFilters = () => {
	const searchTerm = filterState.search
	const selectedTags = filterState.tags

	projectCards.forEach((card) => {
		const cardTags = card.dataset.tags ? card.dataset.tags.split("|") : []
		const cardSearch = card.dataset.search || ""

		const matchesTag =
			selectedTags.size === 0 || cardTags.some((tag) => selectedTags.has(tag))
		const matchesSearch = cardSearch.includes(searchTerm)

		card.style.display = matchesTag && matchesSearch ? "" : "none"
	})
}

const handleChipClick = (event) => {
	const button = event.currentTarget
	const filter = button.dataset.filter

	if (filter === "all") {
		filterState.tags.clear()
		updateChipStates()
		applyFilters()
		return
	}

	if (filterState.tags.has(filter)) {
		filterState.tags.delete(filter)
	} else {
		filterState.tags.add(filter)
	}

	updateChipStates()
	applyFilters()
}

const updateChipStates = () => {
	if (!chipsContainer) {
		return
	}

	const chips = chipsContainer.querySelectorAll(".filter-chip")
	chips.forEach((chip) => {
		const filter = chip.dataset.filter
		if (filter === "all") {
			chip.classList.toggle("active", filterState.tags.size === 0)
		} else {
			chip.classList.toggle("active", filterState.tags.has(filter))
		}
	})
}

const renderTagChips = () => {
	if (!chipsContainer) {
		chipsContainer = document.getElementById("filter-chips")
	}
	if (!chipsContainer) {
		return
	}

	chipsContainer.innerHTML = ""

	const allChip = document.createElement("button")
	allChip.className =
		"filter-chip" + (filterState.tags.size === 0 ? " active" : "")
	allChip.type = "button"
	allChip.textContent = "All"
	allChip.dataset.filter = "all"
	allChip.addEventListener("click", handleChipClick)
	chipsContainer.appendChild(allChip)

	const sortedEntries = Array.from(availableTags.entries()).sort((a, b) =>
		a[1].localeCompare(b[1])
	)

	sortedEntries.forEach(([lower, label]) => {
		const chip = document.createElement("button")
		chip.className =
			"filter-chip" + (filterState.tags.has(lower) ? " active" : "")
		chip.type = "button"
		chip.textContent = label
		chip.dataset.filter = lower
		chip.addEventListener("click", handleChipClick)
		chipsContainer.appendChild(chip)
	})
}

const initFilters = () => {
	const searchInput = document.getElementById("project-search")
	chipsContainer = document.getElementById("filter-chips")

	if (searchInput) {
		searchInput.addEventListener("input", (event) => {
			filterState.search = event.target.value.trim().toLowerCase()
			applyFilters()
		})
	}

	renderTagChips()
}

const enableSlashShortcut = () => {
	const searchInput = document.getElementById("project-search")
	if (!searchInput) {
		return
	}

	window.addEventListener("keydown", (event) => {
		if (event.key !== "/" || event.ctrlKey || event.metaKey || event.altKey) {
			return
		}

		const activeElement = document.activeElement
		const isTyping =
			activeElement &&
			(activeElement.tagName === "INPUT" ||
				activeElement.tagName === "TEXTAREA" ||
				activeElement.isContentEditable)

		if (isTyping) {
			return
		}

		event.preventDefault()
		searchInput.focus()
	})
}

const createCardLabel = (text) => {
	const label = document.createElement("span")
	label.className = "card-label"
	label.textContent = text
	return label
}

initFilters()
enableSlashShortcut()

// Fetch and display GitHub projects
loadJsonc("projects.jsonc")
	.then((projects) => {
		const projectsElement = document.getElementById("projects")

		projects.forEach(async (project) => {
			const projectElement = document.createElement("div")
			projectElement.className = "project"

			const projectName = document.createElement("h3")
			projectName.textContent = project.name

			const tags = normaliseTags(project.tags)
			ensureTagsTracked(tags)
			const tagsGroup = createTagGroup(tags)

			let projectDescriptionText =
				project.description || "Loading details from GitHub..."

			const projectDescription = document.createElement("p")
			projectDescription.textContent = projectDescriptionText

			const buttonGroup = document.createElement("div")
			buttonGroup.className = "button-group"

			if (project.url !== "#") {
				const projectURL =
					project.url && project.url.trim() !== ""
						? project.url
						: "https://" + project.name + ".myapp.sh"

				const projectLink = document.createElement("button")
				projectLink.className = "button button-primary"
				projectLink.onclick = () => window.open(projectURL, "_blank")
				projectLink.textContent = "Launch"
				projectLink.setAttribute(
					"aria-label",
					"Open " + project.name + " project"
				)
				buttonGroup.appendChild(projectLink)
			}

			const codeURL = "https://github.com/surgery18/" + project.name
			const codeLink = document.createElement("button")
			codeLink.className = "button button-success"
			codeLink.onclick = () => window.open(codeURL, "_blank")
			codeLink.textContent = "View Code"
			codeLink.setAttribute("aria-label", "View " + project.name + " on GitHub")

			buttonGroup.appendChild(codeLink)

			projectElement.appendChild(projectName)
			projectElement.appendChild(tagsGroup)
			projectElement.appendChild(projectDescription)
			projectElement.appendChild(buttonGroup)

			projectsElement.appendChild(projectElement)
			registerProjectCard(
				projectElement,
				tags,
				project.name,
				projectDescriptionText
			)

			if (projectDescriptionText === "Loading details from GitHub...") {
				try {
					const repoResponse = await fetch(
						"https://api.github.com/repos/surgery18/" + project.name
					)
					const repoData = await repoResponse.json()
					const descriptionUpdate =
						repoData.description || "No description available."
					projectDescription.textContent = descriptionUpdate
					updateCardDescription(
						projectElement,
						project.name,
						descriptionUpdate,
						tags
					)
				} catch (error) {
					console.error(
						"Error fetching description from GitHub for",
						project.name,
						":",
						error
					)
					projectDescription.textContent = "Error loading description."
					updateCardDescription(
						projectElement,
						project.name,
						"Error loading description.",
						tags
					)
				}
			}
		})

		renderTagChips()
	})
	.catch((error) => {
		console.error("Error fetching projects:", error)
	})

// Fetch and display non-GitHub projects
loadJsonc("non_gh_projects.jsonc")
	.then((projects) => {
		const projectsElement = document.getElementById("non-gh-projects")

		for (const project of projects) {
			const projectElement = document.createElement("div")
			projectElement.className = "project"

			const projectName = document.createElement("h3")
			projectName.textContent = project.name

			const tags = normaliseTags(project.tags)
			ensureTagsTracked(tags)
			const tagsGroup = createTagGroup(tags)

			const projectDescription = document.createElement("p")
			projectDescription.textContent = project.description

			const projectURL =
				project.url && project.url.trim() !== ""
					? project.url
					: project.name + ".myapp.sh"

			const projectLink = document.createElement("button")
			projectLink.className = "button button-primary"
			projectLink.onclick = () => window.open(projectURL, "_blank")
			projectLink.textContent = "Launch"
			projectLink.setAttribute(
				"aria-label",
				"Open " + project.name + " project"
			)

			const buttonGroup = document.createElement("div")
			buttonGroup.className = "button-group"
			buttonGroup.appendChild(projectLink)

			projectElement.appendChild(projectName)
			projectElement.appendChild(tagsGroup)
			projectElement.appendChild(projectDescription)
			projectElement.appendChild(buttonGroup)

			projectsElement.appendChild(projectElement)
			registerProjectCard(
				projectElement,
				tags,
				project.name,
				project.description
			)
		}

		renderTagChips()
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
			videoElement.appendChild(createCardLabel("Resume"))

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
				const videoId = match[1]
				const embedUrl = "https://www.youtube.com/embed/" + videoId

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
				const videoTag = document.createElement("video")
				videoTag.controls = true
				videoTag.width = 560
				videoTag.height = 315

				const source = document.createElement("source")
				source.src = video.url
				source.type = video.type || "video/mp4"

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
