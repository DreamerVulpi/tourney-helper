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

	handlers map[string]http.HandlerFunc

	mu sync.Mutex
}

func NewOAuthCallbackServer(addr string, lang locale.Lang) *OAuthCallbackServer {
	texts := locale.PagesFor(lang)
	logger.Log(entityLogger.Info, fmt.Sprintf(
		"OAuth server init: lang=%q -> heading=%q", lang, texts.Success.Heading,
	))
	o := &OAuthCallbackServer{
		handlers: make(map[string]http.HandlerFunc),
		mux:      http.NewServeMux(),
		texts:    locale.PagesFor(lang),
	}
	o.mux.HandleFunc("/", o.router)

	o.server = &http.Server{
		Addr:    addr,
		Handler: o.mux,
	}

	return o
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
				Page:    texts.ErrorCantAuth,
				Success: false,
			})
			return
		}
		code := r.URL.Query().Get("code")
		if code == "" {
			writePage(w, http.StatusBadRequest, pageData{
				Page:    texts.ErrorDontGetCode,
				Success: false,
			})
			return
		}
		writePage(w, http.StatusOK, pageData{
			Page:    texts.Success,
			Success: true,
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
