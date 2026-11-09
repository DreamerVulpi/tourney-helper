package widget

import (
	"net"
	"net/http"
	"sync"
	"time"

	"context"

	"github.com/dreamervulpi/tourney-helper/config"
	"github.com/dreamervulpi/tourney-helper/internal/widgets/handler"
	"github.com/dreamervulpi/tourney-helper/internal/widgets/service"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

const (
	WAILS_LOCALHOST1 = "http://wails.localhost:34115"
	WAILS_LOCALHOST2 = "http://localhost:34115"
	// Production Wails serves the frontend from http://wails.localhost
	// (without a port) on Windows.
	WAILS_PROD       = "http://wails.localhost"
	WAILS_PROD_HTTPS = "https://wails.localhost"
	LOCALHOST        = "http://localhost:8080"
	OTHER_LOCALHOST  = "http://127.0.0.1:8080"
)

type Server struct {
	httpServer *http.Server
	router     *gin.Engine
	bracket    *handler.Handler
	scoreboard *handler.ScoreboardHandler

	mu      sync.RWMutex
	baseURL string
}

func NewServer() *Server {
	r := gin.Default()
	r.Use(cors.New(cors.Config{
		AllowOrigins: []string{
			WAILS_LOCALHOST1,
			WAILS_LOCALHOST2,
			WAILS_PROD,
			WAILS_PROD_HTTPS,
			LOCALHOST,
			OTHER_LOCALHOST,
		},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Content-Type", "Authorization"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	server := &Server{
		router:     r,
		bracket:    handler.NewHandler(),
		scoreboard: handler.NewScoreboardHandler(),
	}

	server.registerRoutes()

	return server
}

func (s *Server) Start(addr string) error {
	ln, err := net.Listen("tcp", addr)
	if err != nil {
		return err
	}

	srv := &http.Server{Handler: s.router}

	s.mu.Lock()
	s.httpServer = srv
	s.baseURL = baseURLFromListener(ln)
	s.mu.Unlock()

	return srv.Serve(ln)
}

// StartAsync синхронно создаёт HTTP-сервер и запускает прослушивание в фоне.
// Возвращает канал с результатом Serve.
func (s *Server) StartAsync(addr string) (<-chan error, error) {
	ln, err := net.Listen("tcp", addr)
	if err != nil {
		return nil, err
	}

	srv := &http.Server{Handler: s.router}

	s.mu.Lock()
	s.httpServer = srv
	s.baseURL = baseURLFromListener(ln)
	s.mu.Unlock()

	errCh := make(chan error, 1)
	go func() {
		errCh <- srv.Serve(ln)
	}()

	return errCh, nil
}

// BaseURL returns the URL the widget server is actually listening on.
func (s *Server) BaseURL() string {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.baseURL
}

func baseURLFromListener(ln net.Listener) string {
	_, port, err := net.SplitHostPort(ln.Addr().String())
	if err != nil {
		return ""
	}
	return "http://127.0.0.1:" + port
}

func (s *Server) Stop(ctx context.Context) error {
	s.mu.RLock()
	srv := s.httpServer
	s.mu.RUnlock()

	if srv == nil {
		return nil
	}

	return srv.Shutdown(ctx)
}

func (s *Server) SetBracketService(bracketService *service.BracketService) {
	s.bracket.SetBracketService(bracketService)
}

func (s *Server) SetBracketState(state config.WidgetBracket) {
	s.bracket.SetBracketState(state)
}

func (s *Server) SetScoreboardService(scoreboardService *service.ScoreboardService) {
	s.scoreboard.SetScoreboardService(scoreboardService)
}

func (s *Server) SetScoreboardState(state config.WidgetScoreboard) {
	s.scoreboard.SetState(state)
}
