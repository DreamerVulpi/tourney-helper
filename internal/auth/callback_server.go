package auth

import (
	"context"
	"fmt"
	"net/http"
	"sync"

	"github.com/dreamervulpi/tourney-helper/internal/entity/locale/pages"
	entityLogger "github.com/dreamervulpi/tourney-helper/internal/entity/logger"
	"github.com/dreamervulpi/tourney-helper/internal/usecase/locale"
	"github.com/dreamervulpi/tourney-helper/internal/usecase/logger"
)

type OAuthCallbackServer struct {
	server *http.Server
	mux    *http.ServeMux

	texts pages.Pages

	handlers    map[string]http.HandlerFunc
	pendingURLs map[string]string

	mu sync.Mutex
}

func (o *OAuthCallbackServer) RegisterRedirect(path string, authURL string) {
	o.mu.Lock()
	defer o.mu.Unlock()

	o.pendingURLs[path] = authURL
	o.handlers[path] = o.redirectHandler
}

func NewOAuthCallbackServer(addr string, lang locale.Lang) *OAuthCallbackServer {
	texts := locale.PagesFor(lang)
	logger.Log(entityLogger.Debug, fmt.Sprintf(
		"OAuth server init: lang=%q -> heading=%q", lang, texts.Success.Heading,
	))
	o := &OAuthCallbackServer{
		handlers:    make(map[string]http.HandlerFunc),
		pendingURLs: make(map[string]string),
		mux:         http.NewServeMux(),
		texts:       texts,
	}

	o.mux.HandleFunc("/redirect", o.redirectHandler)
	o.mux.HandleFunc("/", o.router)

	o.server = &http.Server{
		Addr:    addr,
		Handler: o.mux,
	}

	return o
}

func (o *OAuthCallbackServer) SetPendingURL(path string, authURL string) {
	o.mu.Lock()
	defer o.mu.Unlock()
	o.pendingURLs[path] = authURL
}

func (o *OAuthCallbackServer) redirectHandler(w http.ResponseWriter, r *http.Request) {
	o.mu.Lock()
	authURL := o.pendingURLs[r.URL.Path]
	o.mu.Unlock()

	if authURL == "" {
		http.Error(w, "No pending auth URL", http.StatusBadRequest)
		return
	}

	texts := o.getTexts()
	writeRedirectPage(w, authURL, texts)
}

func (o *OAuthCallbackServer) router(w http.ResponseWriter, r *http.Request) {
	o.mu.Lock()
	handler, ok := o.handlers[r.URL.Path]
	o.mu.Unlock()

	texts := o.getTexts()
	if !ok {
		writePage(w, http.StatusNotFound, pageData{
			Page:    texts.ErrorNoPage,
			Success: false,
		})
		return
	}

	handler(w, r)
}

func (o *OAuthCallbackServer) Start() {
	go func() {
		err := o.server.ListenAndServe()
		if err != nil && err != http.ErrServerClosed {
			logger.Log(entityLogger.Error, fmt.Sprintf("OAuth callback server error: %v\n", err))
		}
	}()
}

func (o *OAuthCallbackServer) Register(path string, state string, codeChan chan string) {
	o.mu.Lock()
	defer o.mu.Unlock()

	o.handlers[path] = func(w http.ResponseWriter, r *http.Request) {
		texts := o.getTexts()

		receivedState := r.URL.Query().Get("state")
		if receivedState != state {
			writePage(w, http.StatusBadRequest, pageData{
				Page:      texts.ErrorCantAuth,
				AutoClose: texts.AutoClose,
				Success:   false,
			})
			return
		}
		code := r.URL.Query().Get("code")
		if code == "" {
			writePage(w, http.StatusBadRequest, pageData{
				Page:      texts.ErrorDontGetCode,
				AutoClose: texts.AutoClose,
				Success:   false,
			})
			return
		}
		writePage(w, http.StatusOK, pageData{
			Page:      texts.Success,
			AutoClose: texts.AutoClose,
			Success:   true,
		})
		codeChan <- code
	}
}

func (o *OAuthCallbackServer) SetLanguage(lang locale.Lang) {
	o.mu.Lock()
	o.texts = locale.PagesFor(lang)
	o.mu.Unlock()
}

func (o *OAuthCallbackServer) getTexts() pages.Pages {
	o.mu.Lock()
	defer o.mu.Unlock()
	return o.texts
}

func (o *OAuthCallbackServer) Shutdown(ctx context.Context) error {
	return o.server.Shutdown(ctx)
}
