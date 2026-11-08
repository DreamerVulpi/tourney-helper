package widget

import (
	"net/http"
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
	srv := &http.Server{
		Addr:    addr,
		Handler: s.router,
	}
	s.httpServer = srv

	return srv.ListenAndServe()
}

// StartAsync синхронно создаёт HTTP-сервер и запускает прослушивание в фоне.
// Возвращает канал с результатом ListenAndServe.
func (s *Server) StartAsync(addr string) <-chan error {
	srv := &http.Server{
		Addr:    addr,
		Handler: s.router,
	}
	s.httpServer = srv

	errCh := make(chan error, 1)
	go func() {
		errCh <- srv.ListenAndServe()
	}()

	return errCh
}

func (s *Server) Stop(ctx context.Context) error {
	if s.httpServer == nil {
		return nil
	}

	return s.httpServer.Shutdown(ctx)
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
