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

	bracket, err := h.bracketService.Get(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err,
		})
		return
	}

	c.JSON(http.StatusOK, bracket)
}
