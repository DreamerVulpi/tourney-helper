package pages

var En = Pages{
	Success: Page{
		Title:   "Authentication successful",
		Heading: "Done!",
		Message: "This tab will close automatically. You can return to the app.",
	},
	ErrorCantAuth: Page{
		Title:   "Authentication error",
		Heading: "Unable to authenticate",
		Message: "Close this tab and try again.",
	},
	ErrorDontGetCode: Page{
		Title:   "Authentication error",
		Heading: "Code not received",
		Message: "Close this tab and try again.",
	},
	ErrorNoPage: Page{
		Title:   "No page",
		Heading: "Тhis page doesn't exist",
		Message: "Close the tab and try again.",
	},
	AutoClose: AutoClose{
		Title:        "Automatic closure in",
		FallbackHint: "The browser did not allow the tab to close automatically—please close it manually.",
		TimeUnit:     "s.",
		ButtonLabel:  "Close",
	},
	Redirect: Page{
		Title:   "Redirecting...",
		Heading: "Redirecting",
		Message: "Please, wait...",
	},
	ErrorBrowserDeny: Page{
		Title:   "Error",
		Heading: "No Access",
		Message: "Your browser has blocked the authorization window from opening. Please allow pop-ups for this site or use the button below.",
	},
}
