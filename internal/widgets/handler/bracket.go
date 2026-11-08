package handler

import (
	"errors"
	"fmt"
	"net/http"
	"strings"
	"sync"

	"github.com/dreamervulpi/tourney-helper/config"
	uiLocale "github.com/dreamervulpi/tourney-helper/internal/entity/locale/ui"
	entityLogger "github.com/dreamervulpi/tourney-helper/internal/entity/logger"
	entity "github.com/dreamervulpi/tourney-helper/internal/entity/widgets"
	"github.com/dreamervulpi/tourney-helper/internal/usecase/logger"
	"github.com/dreamervulpi/tourney-helper/internal/widgets/service"
	"github.com/gin-gonic/gin"
)

type BracketFlags struct {
	Transparent bool    `json:"transparent"`
	HideRounds  bool    `json:"hideRounds"`
	BracketMode string  `json:"bracketMode"`
	Scale       float64 `json:"scale"`
	AutoRefresh bool    `json:"autoRefresh"`
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

// SetBracketState инициализирует флаги виджета значениями из конфигурации
// в момент запуска. Это гарантирует, что /bracket/flags отдаёт актуальное
// состояние даже если POST из фронтенда пришёл до старта сервера.
func (h *Handler) SetBracketState(state config.WidgetBracket) {
	f := BracketFlags{
		Transparent: state.ClearBackground,
		HideRounds:  state.HideStages,
		BracketMode: state.BracketMode,
		Scale:       state.Scale,
		AutoRefresh: state.AutoRefresh,
	}
	normalizeBracketFlags(&f)

	h.flagsMu.Lock()
	h.flags = f
	h.flagsMu.Unlock()
}

func (h *Handler) RegisterRoutes(r *gin.RouterGroup) {
	r.GET("/bracket/flags", h.GetBracketFlags)
	r.POST("/bracket/flags", h.SetBracketFlags)
	r.GET("/bracket/:id/data", h.GetBracketData)
	r.GET("/bracket/:id", h.GetBracket)
}

func (h *Handler) GetBracketData(c *gin.Context) {
	id := c.Param("id")
	theme := c.Query("theme")

	c.Header("Cache-Control", "no-store")

	view, err := h.bracketService.GetBracketView(c.Request.Context(), id, theme)
	if err != nil {
		external := errors.Is(err, entity.ErrExternalService)
		logBracketError("data", id, theme, external, err)

		if external {
			c.JSON(http.StatusServiceUnavailable, gin.H{
				"code":  "external",
				"error": err.Error(),
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"code":  "internal",
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, view)
}

func (h *Handler) GetBracket(c *gin.Context) {
	id := c.Param("id")
	theme := c.Query("theme")
	messages := bracketErrorMessages(c.Query("lang"))

	c.Header("Cache-Control", "no-store")

	html, err := h.bracketService.RenderWithMessages(
		c.Request.Context(),
		id,
		theme,
		messages,
	)
	if err != nil {
		external := errors.Is(err, entity.ErrExternalService)
		logBracketError("page", id, theme, external, err)

		// Для ошибок внешнего сервиса отдаём полноценную страницу виджета
		// с локализованным оверлеем и возможностью повторить запрос.
		if external {
			if errorHTML, renderErr := h.bracketService.RenderError(theme, messages); renderErr == nil {
				c.Data(http.StatusServiceUnavailable, "text/html; charset=utf-8", []byte(errorHTML))
				return
			} else {
				logBracketError("error-page", id, theme, external, renderErr)
			}
		}

		c.String(http.StatusInternalServerError, err.Error())
		return
	}

	c.Data(http.StatusOK, "text/html; charset=utf-8", []byte(html))
}

func bracketErrorMessages(lang string) entity.BracketErrorMessages {
	panel := uiLocale.Ru.WidgetBracketPanel
	if strings.EqualFold(strings.TrimSpace(lang), "en") {
		panel = uiLocale.En.WidgetBracketPanel
	}

	return entity.BracketErrorMessages{
		Title:       panel.ExternalErrorTitle,
		Description: panel.ExternalErrorDescription,
		RetryLabel:  panel.RetryLabel,
	}
}

// logBracketError пишет ошибки виджета турнирной сетки во внутренний лог.
func logBracketError(scope, id, theme string, external bool, err error) {
	if err == nil {
		return
	}

	origin := "internal"
	if external {
		origin = "external"
	}

	logger.Log(entityLogger.Debug, fmt.Sprintf(
		"[widget bracket] %s error (%s): id=%q theme=%q err=%v",
		scope,
		origin,
		id,
		theme,
		err,
	))
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

	normalizeBracketFlags(&f)

	h.flagsMu.Lock()
	h.flags = f
	h.flagsMu.Unlock()

	c.JSON(http.StatusOK, f)
}

func normalizeBracketFlags(f *BracketFlags) {
	switch f.BracketMode {
	case "all", "winners", "losers":
	default:
		f.BracketMode = "all"
	}

	if f.Scale <= 0 {
		f.Scale = 1.0
	}
}

func (h *Handler) ListThemes(c *gin.Context) {
	themes, err := h.bracketService.ListThemes()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"themes": themes})
}
