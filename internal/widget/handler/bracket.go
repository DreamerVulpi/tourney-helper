package handler

import (
	"net/http"

	"github.com/dreamervulpi/tourney-helper/internal/widget/service"
	"github.com/gin-gonic/gin"
)

type Handler struct {
	bracketService *service.BracketService
}

func NewHandler() *Handler {
	return &Handler{}
}

func (h *Handler) SetBracketService(bracketService *service.BracketService) {
	h.bracketService = bracketService
}

func (h *Handler) RegisterRoutes(r *gin.RouterGroup) {
	r.GET("/bracket/:id", h.GetBracket)
}

func (h *Handler) GetBracket(c *gin.Context) {
	id := c.Param("id")
	theme := c.Query("theme")

	html, err := h.bracketService.RenderWithTheme(c.Request.Context(), id, theme)
	if err != nil {
		c.String(http.StatusInternalServerError, err.Error())
		return
	}

	c.Data(http.StatusOK, "text/html; charset=utf-8", []byte(html))
}

func (h *Handler) ListThemes(c *gin.Context) {
	themes, err := h.bracketService.ListThemes()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"themes": themes})
}
