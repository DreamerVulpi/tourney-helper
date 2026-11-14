package widget

func (s *Server) registerRoutes() {
	widget := s.router.Group("/widgets")
	s.bracket.RegisterRoutes(widget)
	s.scoreboard.RegisterRoutes(widget)
}
