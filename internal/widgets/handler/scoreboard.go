package handler

import (
	"net/http"
	"strings"
	"sync"

	"github.com/dreamervulpi/tourney-helper/internal/widgets/flags"
	"github.com/gin-gonic/gin"
)

type ScoreboardFlags struct {
	HideLogos bool    `json:"hideLogos"`
	HideFlags bool    `json:"hideFlags"`
	Scale     float64 `json:"scale"`
}

// ScoreboardHandler — заглушка виджета scoreboard.
// Полноценный рендер будет добавлен отдельной итерацией.
type ScoreboardHandler struct {
	flags   ScoreboardFlags
	flagsMu sync.RWMutex
}

func NewScoreboardHandler() *ScoreboardHandler {
	return &ScoreboardHandler{}
}

func (h *ScoreboardHandler) RegisterRoutes(r *gin.RouterGroup) {
	r.GET("/scoreboard/flags", h.GetFlags)
	r.POST("/scoreboard/flags", h.SetFlags)
	r.GET("/scoreboard/flags/:code", h.GetFlag)
	r.GET("/scoreboard", h.GetScoreboard)
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

func (h *ScoreboardHandler) GetScoreboard(c *gin.Context) {
	c.Data(http.StatusOK, "text/html; charset=utf-8", []byte(scoreboardStubHTML))
}

// Request on endpoint for sync state between Wails WebView and outer browsers
func (h *ScoreboardHandler) GetFlags(c *gin.Context) {
	h.flagsMu.RLock()
	defer h.flagsMu.RUnlock()

	c.JSON(http.StatusOK, h.flags)
}

func (h *ScoreboardHandler) SetFlags(c *gin.Context) {
	var f ScoreboardFlags
	if err := c.ShouldBindJSON(&f); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if f.Scale <= 0 {
		f.Scale = 1.0
	}

	h.flagsMu.Lock()
	h.flags = f
	h.flagsMu.Unlock()

	c.JSON(http.StatusOK, f)
}

const scoreboardStubHTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Scoreboard</title>
<style>
  html, body { margin: 0; height: 100%; background: #111; color: #f1f5f9; font-family: "Segoe UI", Arial, sans-serif; }
  #stage { height: 100%; display: flex; align-items: center; justify-content: center; transition: transform 0.15s ease; }
  #title { font-size: 22px; font-weight: 600; opacity: 0.75; }
</style>
</head>
<body>
  <div id="stage"><span id="title">Scoreboard widget</span></div>
  <script>
    const stage = document.getElementById('stage');
    function applyFlags(flags) {
      if (!flags) return;
      if (flags.scale > 0) stage.style.transform = 'scale(' + flags.scale + ')';
    }
    window.addEventListener('message', function (event) {
      const data = event.data || {};
      if (data.type === 'scoreboard:flags-changed') applyFlags(data.flags);
    });
    fetch('/widgets/scoreboard/flags').then(function (r) { return r.json(); }).then(applyFlags).catch(function () {});
  </script>
</body>
</html>`
