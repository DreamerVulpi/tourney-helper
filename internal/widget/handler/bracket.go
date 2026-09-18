package handler

import (
	"net/http"
	"sync"

	"github.com/dreamervulpi/tourney-helper/internal/widget/service"
	"github.com/gin-gonic/gin"
)

type BracketFlags struct {
	Transparent bool `json:"transparent"`
	HideRounds  bool `json:"hideRounds"`
	LosersOnly  bool `json:"losersOnly"`
}

type Handler struct {
	bracketService *service.BracketService
	flags          BracketFlags
	flagsMu        sync.RWMutex
}

func NewHandler() *Handler {
	return &Handler{}
}

func (h *Handler) SetBracketService(bracketService *service.BracketService) {
	h.bracketService = bracketService
}

func (h *Handler) RegisterRoutes(r *gin.RouterGroup) {
	r.GET("/bracket/flags", h.GetBracketFlags)
	r.POST("/bracket/flags", h.SetBracketFlags)
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

// Request on endpoint for sync state between Wails WebView and outer browsers
func (h *Handler) GetBracketFlags(c *gin.Context) {
	h.flagsMu.RLock()
	defer h.flagsMu.RUnlock()

	c.JSON(http.StatusOK, h.flags)
}

func (h *Handler) SetBracketFlags(c *gin.Context) {
	var f BracketFlags
	if err := c.ShouldBindJSON(&f); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	h.flagsMu.Lock()
	h.flags = f
	h.flagsMu.Unlock()

	c.JSON(http.StatusOK, f)
}

func (h *Handler) ListThemes(c *gin.Context) {
	themes, err := h.bracketService.ListThemes()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"themes": themes})
}
