const config = {
	defaultGap: 8,
	navSelector: ".Root__globalNav",
	navSelectorClass: "global-libraryX",
	styleSelector: "libraryX-styles",
};

const checkForGlobalNav = () =>
	document.querySelector(".globalNav") ||
	document.querySelector(".Root__globalNav") ||
	false;

let isWindows = detectOS("win");
let isMac = detectOS("mac");

let isGlobalNavAvailable = checkForGlobalNav();
let globalNavElement = getGlobalNavElement();

const setElementPositions = () => {
	const historyButtonsElement = document.querySelector(
		`.Root__globalNav .main-globalNav-historyButtonsContainer > .main-globalNav-historyButtons,
      .Root__globalNav .main-globalNav-historyButtons`,
	);
	if (historyButtonsElement) {
		const historyButtonsWidth =
			historyButtonsElement.getBoundingClientRect().width || 80;

		const historyButtonLeftOffset =
			(isWindows ? 64 : isMac ? 80 : 0) + config.defaultGap;
		if (historyButtonsElement) {
			setElementPositionProperties("history-button", {
				left: historyButtonLeftOffset,
			});
		}

		if (historyButtonsWidth) {
			const searchLeftOffset =
				historyButtonsWidth + (historyButtonLeftOffset || 8);

			setElementPositionProperties("search-container", {
				left: searchLeftOffset,
				top: config.defaultGap,
			});
		}
	}
};

const addButtonText = (elementClassName, textElementPrefix) => {
	const buttonElements = document.querySelectorAll(elementClassName);

	for (const element of buttonElements) {
		if (
			element.querySelector(
				`.main-globalNav-textWrapper,
          .main-globalNav-searchText.encore-text.encore-text-body-medium-bold`,
			)
		)
			return;

		const newTextElement = document.createElement("span");
		newTextElement.className = `main-globalNav-searchText encore-text encore-text-body-medium-bold ${textElementPrefix}`;
		newTextElement.textContent =
			element.getAttribute("aria-label") || element.getAttribute("alt") || "";
		const newTextWrapperElement = document.createElement("span");
		newTextWrapperElement.className = `main-globalNav-textWrapper ${textElementPrefix}-wrapper`;
		newTextWrapperElement.appendChild(newTextElement);

		const iconElement = document.createElement("span");
		if (textElementPrefix === "user-icon") {
			iconElement.className = "Wrapper-medium-only";
			iconElement.style.paddingRight = "0.5rem";
			iconElement.innerHTML = `<?xml version="1.0" encoding="iso-8859-1"?><svg fill="var(--spice-text, #fff)" height="12px" width="12px" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 386.257 386.257" xml:space="preserve"><polygon points="0,96.879 193.129,289.379 386.257,96.879 "/></svg>`;
		}

		element.appendChild(newTextWrapperElement);
		element.appendChild(iconElement);
	}
};

const addGlobalNavStyles = () => {
	setElementPositions();
	addButtonText(
		`.Root__globalNav .search-searchCategory-categoryGrid > div > button, 
.Root__globalNav .main-globalNav-link-icon,
.Root__globalNav .main-globalNav-navLink`,
		"nav",
	);
	addButtonText(".Root__globalNav .main-userWidget-box", "user-icon");
	addLibXClasses();
};

const attachGlobalNavObserver = () => {
	const globalNavObserver = new MutationObserver(addGlobalNavStyles);

	const globalNavButtonWrapperElement = document.querySelector(
		".Root__globalNav .main-globalNav-historyButtonsContainer",
	);

	if (globalNavButtonWrapperElement) {
		globalNavObserver.observe(globalNavButtonWrapperElement, {
			childList: true,
			subtree: true,
		});
	} else {
		globalNavObserver.disconnect();
	}
};

const setElementPositionProperties = (
	propertyName,
	position = { left: 0, top: config.defaultGap, right: 0, bottom: 0 },
) => {
	if (!globalNavElement) return;

	for (const [key, value] of Object.entries(position)) {
		globalNavElement.style.setProperty(
			`--${propertyName}-${key}`,
			`${value}px`,
		);
	}
};

const addLibXClasses = () => {
	try {
		globalNavElement = getGlobalNavElement();
		if (globalNavElement)
			globalNavElement.classList.add(config.navSelectorClass);
	} catch (error) {
		console.error(
			`[RevertX2] Error adding class to global nav element: ${error.message}`,
		);
	}
};

(async () => {
	while (
		!Spicetify?.showNotification ||
		!Spicetify.CosmosAsync ||
		!Spicetify.Platform
	) {
		await new Promise((resolve) => setTimeout(resolve, 100));
	}

	try {
		console.log("[RevertX2] Running...");

		let attempts = 0;
		const maxAttempts = 3;

		const checkGlobalNav = async () => {
			isWindows = detectOS("win");
			isMac = detectOS("mac");

			isGlobalNavAvailable = checkForGlobalNav();
			attempts++;

			if (isGlobalNavAvailable) {
				addGlobalNavStyles();
				setTimeout(addGlobalNavStyles, 1000); // just to make sure every thing works

				attachGlobalNavObserver();
			} else if (attempts < maxAttempts) {
				// GlobalNav not found, wait and try again
				console.log("[RevertX2] GlobalNav not found, retrying...");
				await new Promise((resolve) => setTimeout(resolve, 1000));
				checkGlobalNav();
			} else {
				const msg =
					"[RevertX2] GlobalNav to Library Script is not available on this nav mode.";
				console.error(msg);
				Spicetify.showNotification(msg, true);
			}
		};

		setControlHeight();
		await checkGlobalNav();
	} catch (error) {
		const msg = `[RevertX2] Error running GlobalNav to LibraryX script:${error}`;
		console.error(msg);
		Spicetify.showNotification(msg, true);
	}
})();

/* Optional: to get back Daily mix images */
(() => {
	const themeScript = document.createElement("script");
	themeScript.type = "text/javascript";
	themeScript.src =
		"https://cdn.jsdelivr.net/gh/sanoojes/spicetify-extensions@refs/heads/master/mix-url-fixer/mix-url-fixer.js";
	document.head.appendChild(themeScript);
})();

function setControlHeight(height = 32) {
	// Function to check and apply the titlebar
	const checkAndApplyTitlebar = (API) => {
		if (API) {
			if (API._updateUiClient?.updateTitlebarHeight) {
				API._updateUiClient.updateTitlebarHeight({ height });
			}
		}

		Spicetify.CosmosAsync.post("sp://messages/v1/container/control", {
			type: "update_titlebar",
			height: `${height}px`,
		});
	};

	// Apply titlebar initially
	checkAndApplyTitlebar(Spicetify.Platform.ControlMessageAPI); // Spotify >= 1.2.53
	checkAndApplyTitlebar(Spicetify.Platform.UpdateAPI); // Spotify >= 1.2.51

	// Ensure the titlebar is hidden (spotify likes to change it back sometimes on loadup)
	async function enforceHeight() {
		checkAndApplyTitlebar(Spicetify.Platform.ControlMessageAPI);
		checkAndApplyTitlebar(Spicetify.Platform.UpdateAPI);
	}

	const intervalId = setInterval(enforceHeight, 100); // Every 100ms
	setTimeout(() => {
		clearInterval(intervalId); // Stop after 10 seconds <- need a better killswitch idk mainview ready or something
	}, 10000);

	const handleFullscreenChange = () => {
		checkAndApplyTitlebar(Spicetify.Platform.ControlMessageAPI);
		checkAndApplyTitlebar(Spicetify.Platform.UpdateAPI);
	};

	document.addEventListener("fullscreenchange", handleFullscreenChange);
	document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
	document.addEventListener("mozfullscreenchange", handleFullscreenChange);
	document.addEventListener("msfullscreenchange", handleFullscreenChange);
}

function detectOS(os_name) {
	if (Spicetify.Platform?.operatingSystem)
		return Spicetify.Platform?.operatingSystem
			.toLowerCase()
			.includes(os_name.toLowerCase());

	if (Spicetify.Platform?.PlatformData?.os_name)
		return Spicetify.Platform.PlatformData.os_name
			.toLowerCase()
			.includes(os_name.toLowerCase());

	return false;
}

function getGlobalNavElement() {
	return document.querySelector(config.navSelector);
}
