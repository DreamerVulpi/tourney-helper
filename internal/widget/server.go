package widget

import (
	"net/http"

	"context"

	"github.com/dreamervulpi/tourney-helper/internal/widget/handler"
	"github.com/dreamervulpi/tourney-helper/internal/widget/service"
	"github.com/gin-gonic/gin"
)

type Server struct {
	httpServer *http.Server
	router     *gin.Engine
	bracket    *handler.Handler
}

func NewServer() *Server {
	r := gin.Default()

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
