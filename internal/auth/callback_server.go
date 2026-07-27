package auth

import (
	"context"
	"fmt"
	"net/http"
	"sync"

	entityLogger "github.com/dreamervulpi/tourneyBot/internal/entity/logger"
	"github.com/dreamervulpi/tourneyBot/internal/usecase/logger"
)

type OAuthCallbackServer struct {
	server *http.Server
	mux    *http.ServeMux

	handlers map[string]http.HandlerFunc

	mu sync.Mutex
}

func NewOAuthCallbackServer(addr string) *OAuthCallbackServer {
	o := &OAuthCallbackServer{
		handlers: make(map[string]http.HandlerFunc),
		mux:      http.NewServeMux(),
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

	if !ok {
		http.NotFound(w, r)
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
		receivedState := r.URL.Query().Get("state")
		if receivedState != state {
			http.Error(w, "Invalid state", http.StatusBadRequest)
			return
		}
		code := r.URL.Query().Get("code")
		if code == "" {
			http.Error(w, "Missing code", http.StatusBadRequest)
			return
		}
		fmt.Fprint(w, "Authorization success! Back to program.")
		codeChan <- code
	}
}

func (o *OAuthCallbackServer) Shutdown(ctx context.Context) error {
	return o.server.Shutdown(ctx)
}
