package application

// GetOAuthBaseURL returns the base URL of the OAuth callback server for the
// current application instance. Each instance may use a different port when
// multiple copies of the app are running simultaneously.
func (a *App) GetOAuthBaseURL() string {
	if a.OAuthServer == nil {
		return ""
	}
	return a.OAuthServer.BaseURL()
}

// GetWidgetBaseURL returns the base URL of the running widget server for the
// current application instance. It is empty until the widget server starts.
func (a *App) GetWidgetBaseURL() string {
	if a.WidgetServer == nil {
		return ""
	}
	return a.WidgetServer.BaseURL()
}
