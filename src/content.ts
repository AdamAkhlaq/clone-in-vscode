/**
 * Clone in VS Code - Chromium Browser Extension Content Script
 *
 * This content script adds a "VS Code" tab to GitHub's repository clone dropdown,
 * allowing users to directly clone repositories into VS Code with one click.
 */

interface RepositoryInfo {
	owner: string;
	repo: string;
	isRepository: boolean;
}

interface ElementSelectors {
	cloneMethodList: string[];
	panelContainer: string[];
}

const SELECTORS: ElementSelectors = {
	cloneMethodList: [
		'nav[aria-label="Remote URL selector"] ul[role="list"]',
		'nav[data-testid="remote-url-selector"] ul',
		'.js-git-clone-help-container ul[role="list"]',
		'[class*="UnderlineItemList"] ul',
	],
	panelContainer: [
		".Box-sc-g0xbh4-0.iNJnpb.d-flex.mb-2",
		"div.d-flex.mb-2",
		".Box-sc-g0xbh4-0.iNJnpb",
	],
};

const GITHUB_CLASSES = {
	button: {
		base: "prc-Button-ButtonBase-c50BI",
		content: "prc-Button-ButtonContent-HKbr-",
		label: "prc-Button-Label-pTQ3x",
	},
	panel: {
		container: "Box-sc-g0xbh4-0 iNJnpb d-flex",
		description: "mt-2 fgColor-muted text-normal",
	},
};

const ELEMENT_IDS = {
	vscodeTab: "vscode-tab",
	vscodePanel: "vscode-panel",
};

const DATA_ATTRIBUTES = {
	originalContent: "data-original-content",
	hiddenPanel: "data-vscode-hidden-panel",
	hidden: "data-vscode-hidden",
};

class DOMUtils {
	static createElement<K extends keyof HTMLElementTagNameMap>(
		tagName: K,
		attributes: Record<string, string> = {},
		styles: Record<string, string> = {}
	): HTMLElementTagNameMap[K] {
		const element = document.createElement(tagName);

		Object.entries(attributes).forEach(([key, value]) => {
			if (key === "className") {
				element.className = value;
			} else if (key.startsWith("data-")) {
				element.setAttribute(key, value);
			} else {
				(element as any)[key] = value;
			}
		});

		if (Object.keys(styles).length > 0) {
			element.style.cssText =
				Object.entries(styles)
					.map(([key, value]) => `${key}: ${value} !important`)
					.join("; ") + ";";
		}

		return element;
	}

	static findElement(selectors: string[]): Element | null {
		for (const selector of selectors) {
			const element = document.querySelector(selector);
			if (element) return element;
		}
		return null;
	}

	static findElementByText(
		text: string,
		containerSelector?: string
	): Element | null {
		const elements = Array.from(document.querySelectorAll("*"));
		const targetElement = elements.find(
			(el) =>
				el.textContent?.trim() === text &&
				(containerSelector ? el.closest(containerSelector) : true)
		);
		return targetElement?.closest(containerSelector || "*") || null;
	}
}

class RepositoryDetector {
	static detect(): RepositoryInfo {
		const url = window.location.href;
		const pathname = window.location.pathname;

		if (!url.includes("github.com")) {
			return { owner: "", repo: "", isRepository: false };
		}

		const pathSegments = pathname.slice(1).split("/");
		if (pathSegments.length < 2) {
			return { owner: "", repo: "", isRepository: false };
		}

		const [owner, repo] = pathSegments;
		const excludedPaths = ["orgs", "users", "settings", "notifications"];

		const isRepository =
			pathSegments.length >= 2 &&
			repo !== "" &&
			!repo.includes("?") &&
			!excludedPaths.includes(owner);

		return { owner, repo, isRepository };
	}
}

class VSCodeTabCreator {
	private repoInfo: RepositoryInfo;

	constructor(repoInfo: RepositoryInfo) {
		this.repoInfo = repoInfo;
	}

	create(cloneMethodList: Element): HTMLLIElement {
		const existingClasses = this.extractExistingClasses(cloneMethodList);
		const listItem = this.createListItem(existingClasses);
		const link = this.createTabLink(existingClasses);
		const span = this.createTabSpan(existingClasses);

		link.appendChild(span);
		listItem.appendChild(link);
		this.attachEventListeners(link, cloneMethodList);

		return listItem;
	}

	private extractExistingClasses(cloneMethodList: Element) {
		return {
			listItem:
				cloneMethodList.querySelector("li")?.className ||
				"Box-sc-g0xbh4-0 hUCRAk",
			link:
				cloneMethodList.querySelector("a")?.className ||
				"prc-components-UnderlineItem-lJsg-",
			span:
				cloneMethodList.querySelector('span[data-component="text"]')
					?.className || "",
		};
	}

	private createListItem(classes: any): HTMLLIElement {
		return DOMUtils.createElement("li", {
			className: classes.listItem,
			id: ELEMENT_IDS.vscodeTab,
		});
	}

	private createTabLink(classes: any): HTMLAnchorElement {
		return DOMUtils.createElement("a", {
			className: classes.link,
			href: "#",
			"aria-label": "Clone with VS Code",
		});
	}

	private createTabSpan(classes: any): HTMLSpanElement {
		const attributes: Record<string, string> = {
			"data-component": "text",
			"data-content": "VS Code",
			textContent: "VS Code",
		};

		if (classes.span) {
			attributes.className = classes.span;
		}

		return DOMUtils.createElement("span", attributes);
	}

	private attachEventListeners(
		link: HTMLAnchorElement,
		cloneMethodList: Element
	): void {
		link.addEventListener("click", (e) => {
			e.preventDefault();
			this.handleTabClick(link, cloneMethodList);
		});
	}

	private handleTabClick(
		link: HTMLAnchorElement,
		cloneMethodList: Element
	): void {
		cloneMethodList.querySelectorAll("a").forEach((otherLink) => {
			otherLink.removeAttribute("aria-current");
		});

		link.setAttribute("aria-current", "page");

		const panelManager = new VSCodePanelManager(this.repoInfo);
		panelManager.show();
	}
}

class VSCodeButtonCreator {
	private repoInfo: RepositoryInfo;

	constructor(repoInfo: RepositoryInfo) {
		this.repoInfo = repoInfo;
	}

	create(): HTMLButtonElement {
		const button = this.createButton();
		const content = this.createButtonContent();
		const label = this.createButtonLabel();

		content.appendChild(label);
		button.appendChild(content);
		this.attachClickHandler(button);

		return button;
	}

	private createButton(): HTMLButtonElement {
		return DOMUtils.createElement(
			"button",
			{
				type: "button",
				className: GITHUB_CLASSES.button.base,
				"data-loading": "false",
				"data-size": "medium",
				"data-variant": "primary",
				tabindex: "0",
			},
			{ width: "100%" }
		);
	}

	private createButtonContent(): HTMLSpanElement {
		return DOMUtils.createElement("span", {
			"data-component": "buttonContent",
			"data-align": "center",
			className: GITHUB_CLASSES.button.content,
		});
	}

	private createButtonLabel(): HTMLSpanElement {
		return DOMUtils.createElement("span", {
			"data-component": "text",
			className: GITHUB_CLASSES.button.label,
			textContent: "Clone in VS Code",
		});
	}

	private attachClickHandler(button: HTMLButtonElement): void {
		button.addEventListener("click", () => {
			const vscodeUrl = `vscode://vscode.git/clone?url=https://github.com/${this.repoInfo.owner}/${this.repoInfo.repo}.git`;
			window.open(vscodeUrl, "_blank");
		});
	}
}

class VSCodePanelManager {
	private repoInfo: RepositoryInfo;

	constructor(repoInfo: RepositoryInfo) {
		this.repoInfo = repoInfo;
	}

	show(): void {
		const existingPanel = document.getElementById(
			ELEMENT_IDS.vscodePanel
		) as HTMLElement;

		if (existingPanel) {
			this.showExistingPanel(existingPanel);
			return;
		}

		this.createAndShowNewPanel();
	}

	private showExistingPanel(panel: HTMLElement): void {
		const panelContainer = panel.parentElement;
		if (!panelContainer) return;

		Array.from(panelContainer.children).forEach((child) => {
			if (child.id === ELEMENT_IDS.vscodePanel) {
				(child as HTMLElement).style.display = "block";
			} else {
				(child as HTMLElement).style.display = "none";
				child.setAttribute(DATA_ATTRIBUTES.hiddenPanel, "true");
			}
		});
	}

	private createAndShowNewPanel(): void {
		const panelContainer = this.findPanelContainer();
		if (!panelContainer) {
			return;
		}

		this.prepareContainer(panelContainer);
		const panel = this.createPanel();
		panelContainer.appendChild(panel);
		this.configureContainer(panelContainer);
	}

	private findPanelContainer(): Element | null {
		const remoteUrlNav = document.querySelector(
			'nav[aria-label="Remote URL selector"]'
		);
		if (remoteUrlNav) {
			let sibling = remoteUrlNav.nextElementSibling;
			while (sibling) {
				if (
					sibling.querySelector('input[id*="clone-with"]') ||
					sibling.classList.contains("d-flex") ||
					sibling.classList.contains("Box-sc-g0xbh4-0")
				) {
					return sibling;
				}
				sibling = sibling.nextElementSibling;
			}
		}

		const container = DOMUtils.findElement(SELECTORS.panelContainer);
		if (container) return container;

		const httpsInput = document.querySelector(
			'input[id*="clone-with-https"], input[value*="https://github.com"]'
		);
		return httpsInput?.closest("div") || null;
	}

	private prepareContainer(container: Element): void {
		new DescriptionTextManager().hide();

		if (!container.hasAttribute(DATA_ATTRIBUTES.originalContent)) {
			container.setAttribute(
				DATA_ATTRIBUTES.originalContent,
				container.innerHTML
			);
		}

		container.innerHTML = "";
	}

	private createPanel(): HTMLDivElement {
		const panel = DOMUtils.createElement(
			"div",
			{
				id: ELEMENT_IDS.vscodePanel,
				role: "tabpanel",
				className: GITHUB_CLASSES.panel.container,
			},
			{
				display: "flex",
				"flex-direction": "column",
				width: "100%",
			}
		);

		const button = new VSCodeButtonCreator(this.repoInfo).create();
		const description = this.createDescription();

		panel.appendChild(button);
		panel.appendChild(description);

		return panel;
	}

	private createDescription(): HTMLParagraphElement {
		return DOMUtils.createElement(
			"p",
			{
				className: GITHUB_CLASSES.panel.description,
				textContent: "Clone using VS Code.",
			},
			{ "margin-bottom": "0" }
		);
	}

	private configureContainer(container: Element): void {
		const containerElement = container as HTMLElement;
		containerElement.style.cssText += `
			height: auto !important;
			flex-direction: column !important;
			align-items: stretch !important;
		`;
	}
}

class DescriptionTextManager {
	private readonly hiddenTextPatterns = [
		"Clone using the web URL.",
		"Use a password-protected SSH key.",
		"Work fast with our official CLI. Learn more",
	];

	hide(): void {
		const cloneDropdown = this.findCloneDropdown();

		this.hideDescriptionElements(cloneDropdown);
		this.hideSSHLinks(cloneDropdown);
	}

	show(): void {
		const hiddenElements = document.querySelectorAll(
			`[${DATA_ATTRIBUTES.hidden}="true"]`
		);
		hiddenElements.forEach((element) => {
			(element as HTMLElement).style.display = "";
			element.removeAttribute(DATA_ATTRIBUTES.hidden);
		});
	}

	private findCloneDropdown(): Element | null {
		return document.querySelector(
			'[role="dialog"], .prc-Overlay-Overlay-dVyJl, [data-variant="anchored"]'
		);
	}

	private hideDescriptionElements(cloneDropdown: Element | null): void {
		const elements = document.querySelectorAll("p, div");

		elements.forEach((element) => {
			if (cloneDropdown && cloneDropdown.contains(element)) return;

			const text = element.textContent?.trim() || "";

			if (
				this.hiddenTextPatterns.includes(text) ||
				this.isSSHFlashMessage(element, text)
			) {
				(element as HTMLElement).style.display = "none";
				element.setAttribute(DATA_ATTRIBUTES.hidden, "true");
			}
		});
	}

	private hideSSHLinks(cloneDropdown: Element | null): void {
		const links = document.querySelectorAll("a");

		links.forEach((link) => {
			if (cloneDropdown && cloneDropdown.contains(link)) return;

			const text = link.textContent || "";
			const href = link.href || "";

			if (this.isSSHRelatedLink(text, href)) {
				(link as HTMLElement).style.display = "none";
				link.setAttribute(DATA_ATTRIBUTES.hidden, "true");
			}
		});
	}

	private isSSHFlashMessage(element: Element, text: string): boolean {
		const flashClasses = [
			"prc-Flash-Flash-3q4Aj",
			"flash",
			"flash-warn",
			"flash-error",
		];
		const hasFlashClass = flashClasses.some((cls) =>
			element.classList.contains(cls)
		);
		const hasSSHContent =
			text.includes("SSH key") || text.includes("public key");

		return hasFlashClass && hasSSHContent;
	}

	private isSSHRelatedLink(text: string, href: string): boolean {
		const sshTexts = [
			"Generate new SSH key",
			"Add new SSH key",
			"add a new public key",
		];
		const sshPaths = ["/settings/ssh", "/settings/keys"];

		return (
			sshTexts.some((t) => text.includes(t)) ||
			sshPaths.some((p) => href.includes(p))
		);
	}
}

class TabEventManager {
	private vscodeLink: HTMLAnchorElement;
	private cloneMethodList: Element;

	constructor(vscodeLink: HTMLAnchorElement, cloneMethodList: Element) {
		this.vscodeLink = vscodeLink;
		this.cloneMethodList = cloneMethodList;
	}

	attachExistingTabListeners(): void {
		const nav = this.cloneMethodList.closest("nav");
		if (!nav) return;

		nav.addEventListener("click", (e) => {
			const clickedLink = (e.target as Element).closest("a");
			if (!clickedLink || clickedLink === this.vscodeLink) return;

			setTimeout(() => {
				this.handleExistingTabClick(clickedLink as HTMLAnchorElement);
			}, 10);
		});
	}

	private handleExistingTabClick(clickedLink: HTMLAnchorElement): void {
		this.cloneMethodList.querySelectorAll("a").forEach((link) => {
			link.removeAttribute("aria-current");
		});
		clickedLink.setAttribute("aria-current", "page");

		new DescriptionTextManager().show();
		this.restoreOriginalContent();
	}

	private restoreOriginalContent(): void {
		const vscodePanel = document.getElementById(ELEMENT_IDS.vscodePanel);
		if (!vscodePanel) return;

		const panelContainer = vscodePanel.parentElement;
		if (!panelContainer) return;

		if (panelContainer.hasAttribute(DATA_ATTRIBUTES.originalContent)) {
			this.restoreFromStoredContent(panelContainer);
		} else {
			this.restoreByRemoval(panelContainer, vscodePanel);
		}
	}

	private restoreFromStoredContent(container: Element): void {
		const originalContent = container.getAttribute(
			DATA_ATTRIBUTES.originalContent
		);
		if (originalContent) {
			(container as HTMLElement).style.cssText = "";
			container.innerHTML = originalContent;
			container.removeAttribute(DATA_ATTRIBUTES.originalContent);
		}
	}

	private restoreByRemoval(container: Element, panel: HTMLElement): void {
		(container as HTMLElement).style.cssText = "";
		panel.remove();

		Array.from(container.children).forEach((child) => {
			if (child.hasAttribute(DATA_ATTRIBUTES.hiddenPanel)) {
				(child as HTMLElement).style.display = "";
				child.removeAttribute(DATA_ATTRIBUTES.hiddenPanel);
			}
		});
	}
}

class VSCodeButtonInjector {
	private repoInfo: RepositoryInfo;

	constructor(repoInfo: RepositoryInfo) {
		this.repoInfo = repoInfo;
	}

	inject(): void {
		const cloneMethodList = this.findCloneMethodList();
		if (!cloneMethodList) {
			return;
		}

		if (this.tabAlreadyExists(cloneMethodList)) {
			return;
		}

		this.createAndInsertTab(cloneMethodList);
	}

	private findCloneMethodList(): Element | null {
		const element = DOMUtils.findElement(SELECTORS.cloneMethodList);
		if (element) return element;

		return DOMUtils.findElementByText("HTTPS", "ul");
	}

	private tabAlreadyExists(cloneMethodList: Element): boolean {
		return !!cloneMethodList.querySelector(`#${ELEMENT_IDS.vscodeTab}`);
	}

	private createAndInsertTab(cloneMethodList: Element): void {
		const tabCreator = new VSCodeTabCreator(this.repoInfo);
		const vscodeTab = tabCreator.create(cloneMethodList);
		const vscodeLink = vscodeTab.querySelector("a") as HTMLAnchorElement;

		const eventManager = new TabEventManager(vscodeLink, cloneMethodList);
		eventManager.attachExistingTabListeners();

		this.insertTab(cloneMethodList, vscodeTab);
		this.setAsDefaultTab(cloneMethodList, vscodeLink);

		const panelManager = new VSCodePanelManager(this.repoInfo);
		panelManager.show();
	}

	private insertTab(cloneMethodList: Element, vscodeTab: HTMLLIElement): void {
		const firstListItem = cloneMethodList.querySelector("li");
		if (firstListItem) {
			cloneMethodList.insertBefore(vscodeTab, firstListItem);
		} else {
			cloneMethodList.appendChild(vscodeTab);
		}
	}

	private setAsDefaultTab(
		cloneMethodList: Element,
		vscodeLink: HTMLAnchorElement
	): void {
		cloneMethodList.querySelectorAll("a").forEach((link) => {
			if (link !== vscodeLink) {
				link.removeAttribute("aria-current");
			}
		});

		vscodeLink.setAttribute("aria-current", "page");
	}
}

class CodeDropdownListener {
	private repoInfo: RepositoryInfo;

	constructor(repoInfo: RepositoryInfo) {
		this.repoInfo = repoInfo;
	}

	setup(): void {
		const codeButton = this.findCodeButton();
		if (!codeButton) {
			return;
		}

		this.attachClickListener(codeButton);
	}

	private findCodeButton(): HTMLButtonElement | undefined {
		return Array.from(document.querySelectorAll("button")).find((btn) =>
			btn.textContent?.includes("Code")
		);
	}

	private attachClickListener(codeButton: HTMLButtonElement): void {
		codeButton.addEventListener("click", () => {
			this.attemptInjection();
		});
	}

	private attemptInjection(): void {
		const injector = new VSCodeButtonInjector(this.repoInfo);
		injector.inject();

		setTimeout(() => {
			injector.inject();
		}, 10);
	}
}

class VSCodeCloneExtension {
	private static instance: VSCodeCloneExtension;
	private observer: MutationObserver | null = null;
	private debounceTimer: number | null = null;
	private currentUrl = "";

	static getInstance(): VSCodeCloneExtension {
		if (!VSCodeCloneExtension.instance) {
			VSCodeCloneExtension.instance = new VSCodeCloneExtension();
		}
		return VSCodeCloneExtension.instance;
	}

	initialize(): void {
		this.currentUrl = window.location.href;
		this.injectIfRepository();
		this.setupNavigationObserver();
	}

	private injectIfRepository(): void {
		const repoInfo = RepositoryDetector.detect();

		if (repoInfo.isRepository) {
			const listener = new CodeDropdownListener(repoInfo);
			listener.setup();
		}
	}

	private setupNavigationObserver(): void {
		this.observer = new MutationObserver(() => {
			this.handlePageChange();
		});

		this.observer.observe(document.body, {
			childList: true,
			subtree: true,
		});
	}

	private handlePageChange(): void {
		if (this.debounceTimer) {
			clearTimeout(this.debounceTimer);
		}

		this.debounceTimer = window.setTimeout(() => {
			const newUrl = window.location.href;
			if (newUrl !== this.currentUrl) {
				this.currentUrl = newUrl;
				this.injectIfRepository();
			}
		}, 100);
	}

	destroy(): void {
		if (this.observer) {
			this.observer.disconnect();
			this.observer = null;
		}
		if (this.debounceTimer) {
			clearTimeout(this.debounceTimer);
			this.debounceTimer = null;
		}
	}
}

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", () => {
		const extension = VSCodeCloneExtension.getInstance();
		extension.initialize();
	});
} else {
	const extension = VSCodeCloneExtension.getInstance();
	extension.initialize();
}

window.addEventListener("beforeunload", () => {
	const extension = VSCodeCloneExtension.getInstance();
	extension.destroy();
});
