package widget

import (
	"net/http"
	"time"

	"context"

	"github.com/dreamervulpi/tourney-helper/internal/widgets/handler"
	"github.com/dreamervulpi/tourney-helper/internal/widgets/service"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

const (
	WAILS_LOCALHOST1 = "http://wails.localhost:34115"
	WAILS_LOCALHOST2 = "http://localhost:34115"
	LOCALHOST        = "http://localhost:8080"
	OTHER_LOCALHOST  = "http://127.0.0.1:8080"
)

type Server struct {
	httpServer *http.Server
	router     *gin.Engine
	bracket    *handler.Handler
}

func NewServer() *Server {
	r := gin.Default()
	r.Use(cors.New(cors.Config{
		AllowOrigins: []string{
			WAILS_LOCALHOST1,
			WAILS_LOCALHOST2,
			LOCALHOST,
			OTHER_LOCALHOST,
		},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Content-Type", "Authorization"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	server := &Server{
		router:  r,
		bracket: handler.NewHandler(),
	}

	server.registerRoutes()

	return server
}

func (s *Server) Start(addr string) error {
	s.httpServer = &http.Server{
		Addr:    addr,
		Handler: s.router,
	}

	return s.httpServer.ListenAndServe()
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
