package handler

import (
	"net/http"
	"path/filepath"
	"strings"
	"sync"

	"github.com/dreamervulpi/tourney-helper/config"
	"github.com/dreamervulpi/tourney-helper/internal/widgets/flags"
	"github.com/dreamervulpi/tourney-helper/internal/widgets/icons"
	"github.com/dreamervulpi/tourney-helper/internal/widgets/logos"
	"github.com/dreamervulpi/tourney-helper/internal/widgets/planks"
	"github.com/dreamervulpi/tourney-helper/internal/widgets/service"
	"github.com/gin-gonic/gin"
)

// ScoreboardHandler хранит актуальное состояние виджета и отдаёт его
// в HTML-рендер, внешним браузерам (polling) и preview-iframe.
type ScoreboardHandler struct {
	scoreboardService *service.ScoreboardService
	state             config.WidgetScoreboard
	stateMu           sync.RWMutex
}

func NewScoreboardHandler() *ScoreboardHandler {
	return &ScoreboardHandler{}
}

func (h *ScoreboardHandler) SetScoreboardService(s *service.ScoreboardService) {
	h.scoreboardService = s
}

func (h *ScoreboardHandler) SetState(state config.WidgetScoreboard) {
	h.stateMu.Lock()
	h.state = state
	h.stateMu.Unlock()
}

func (h *ScoreboardHandler) GetState() config.WidgetScoreboard {
	h.stateMu.RLock()
	defer h.stateMu.RUnlock()
	return h.state
}

func (h *ScoreboardHandler) RegisterRoutes(r *gin.RouterGroup) {
	r.GET("/scoreboard", h.GetScoreboard)
	r.GET("/scoreboard/state", h.GetScoreboardState)
	r.POST("/scoreboard/state", h.SetScoreboardState)
	r.GET("/scoreboard/theme/:name", h.GetTheme)
	r.GET("/scoreboard/flags/:code", h.GetFlag)
	r.GET("/scoreboard/logos/:name", h.GetLogo)
	r.GET("/scoreboard/planks/:name", h.GetPlank)
	r.GET("/scoreboard/icons/:name", h.GetIcon)
}

func (h *ScoreboardHandler) GetScoreboard(c *gin.Context) {
	if h.scoreboardService == nil {
		c.String(http.StatusInternalServerError, "scoreboard service is not initialized")
		return
	}

	state := h.GetState()

	html, err := h.scoreboardService.RenderWithTheme(state, state.Theme)
	if err != nil {
		c.String(http.StatusInternalServerError, err.Error())
		return
	}

	c.Data(http.StatusOK, "text/html; charset=utf-8", []byte(html))
}

func (h *ScoreboardHandler) GetScoreboardState(c *gin.Context) {
	c.JSON(http.StatusOK, h.GetState())
}

func (h *ScoreboardHandler) SetScoreboardState(c *gin.Context) {
	var state config.WidgetScoreboard
	if err := c.ShouldBindJSON(&state); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if state.Scale <= 0 {
		state.Scale = 1.0
	}

	h.SetState(state)
	c.JSON(http.StatusOK, state)
}

func (h *ScoreboardHandler) GetTheme(c *gin.Context) {
	if h.scoreboardService == nil {
		c.String(http.StatusInternalServerError, "scoreboard service is not initialized")
		return
	}

	name := c.Param("name")

	css, err := h.scoreboardService.GetThemeCSS(name)
	if err != nil {
		c.String(http.StatusNotFound, err.Error())
		return
	}

	c.Data(http.StatusOK, "text/css; charset=utf-8", []byte(css))
}

// GetFlag отдаёт PNG-изображение флага страны по коду (например, gb.png).
func (h *ScoreboardHandler) GetFlag(c *gin.Context) {
	code := strings.TrimSuffix(c.Param("code"), ".png")

	data, err := flags.Read(code)
	if err != nil {
		c.Status(http.StatusNotFound)
		return
	}

	c.Data(http.StatusOK, "image/png", data)
}

// GetLogo отдаёт изображение логотипа из widgets/scoreboard/logos.
func (h *ScoreboardHandler) GetLogo(c *gin.Context) {
	name := c.Param("name")

	data, err := logos.Read(name)
	if err != nil {
		c.Status(http.StatusNotFound)
		return
	}

	c.Data(http.StatusOK, logoContentType(name), data)
}

// GetIcon отдаёт изображение пользовательской иконки.
func (h *ScoreboardHandler) GetIcon(c *gin.Context) {
	name := c.Param("name")

	data, err := icons.Read(name)
	if err != nil {
		c.Status(http.StatusNotFound)
		return
	}

	c.Data(http.StatusOK, logoContentType(name), data)
}

// GetPlank отдаёт изображение пользовательской плашки.
func (h *ScoreboardHandler) GetPlank(c *gin.Context) {
	name := c.Param("name")

	data, err := planks.Read(name)
	if err != nil {
		c.Status(http.StatusNotFound)
		return
	}

	c.Data(http.StatusOK, logoContentType(name), data)
}

func logoContentType(name string) string {
	switch strings.ToLower(filepath.Ext(name)) {
	case ".png":
		return "image/png"
	case ".jpg", ".jpeg":
		return "image/jpeg"
	case ".webp":
		return "image/webp"
	case ".gif":
		return "image/gif"
	case ".bmp":
		return "image/bmp"
	default:
		return "application/octet-stream"
	}
}
