package widget

func (s *Server) registerRoutes() {
	widget := s.router.Group("/widget")
	s.bracket.RegisterRoutes(widget)
}
