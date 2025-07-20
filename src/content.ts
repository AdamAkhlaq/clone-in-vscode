// Clone in VS Code - Content Script
// Injects a "Clone in VS Code" button into GitHub repository pages

console.log("Clone in VS Code extension loaded");

// GitHub repository detection
interface RepositoryInfo {
	owner: string;
	repo: string;
	isRepository: boolean;
}

function detectGitHubRepository(): RepositoryInfo {
	const url = window.location.href;
	const pathname = window.location.pathname;

	// Check if we're on GitHub
	if (!url.includes("github.com")) {
		return { owner: "", repo: "", isRepository: false };
	}

	// Extract path segments (remove leading slash and split)
	const pathSegments = pathname.slice(1).split("/");

	// Need at least 2 segments for owner/repo
	if (pathSegments.length < 2) {
		return { owner: "", repo: "", isRepository: false };
	}

	const [owner, repo] = pathSegments;

	// Check if this is a repository page (not user/org profile)
	// Repository pages have at least owner/repo structure
	// User/org profiles would just be github.com/username
	const isRepository =
		pathSegments.length >= 2 &&
		repo !== "" &&
		!repo.includes("?") && // Avoid query parameters
		owner !== "orgs" && // Not organization pages
		owner !== "users" && // Not user pages
		owner !== "settings" && // Not settings pages
		owner !== "notifications"; // Not notification pages

	console.log("Repository detection:", { owner, repo, isRepository, pathname });

	return { owner, repo, isRepository };
}

// TODO: Implement button injection into Code dropdown
// TODO: Implement VS Code URL generation and handling
// TODO: Implement SPA navigation support

function main() {
	// Test repository detection
	const repoInfo = detectGitHubRepository();

	if (repoInfo.isRepository) {
		console.log(`Detected repository: ${repoInfo.owner}/${repoInfo.repo}`);
		// TODO: Inject Clone in VS Code button
	} else {
		console.log("Not a repository page, skipping button injection");
	}
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", main);
} else {
	main();
}
