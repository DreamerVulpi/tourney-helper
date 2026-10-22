package auth

import (
	"fmt"
	"html/template"
	"net/http"

	"github.com/dreamervulpi/tourney-helper/internal/entity/locale/pages"
)

type pageData struct {
	Page      pages.Page
	AutoClose pages.AutoClose
	Success   bool
}

var callbackPageTmpl = template.Must(template.New("callback").Parse(`<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{.Page.Title}}</title>
    <style>
        :root {
            --bg-main: #0a0a0e;
            --bg-panel: #121217;
            --border-color: #2a2a35;
            --text-main: #ffffff;
            --text-muted: #8a8a9e;
            --accent-blue: #2563eb;
            --success: #22c55e;
            --success-bg: rgba(34, 197, 94, 0.1);
            --success-border: rgba(34, 197, 94, 0.3);
            --error: #ef4444;
            --error-bg: rgba(239, 68, 68, 0.1);
            --error-border: rgba(239, 68, 68, 0.3);
        }
        * { box-sizing: border-box; }
        body {
            margin: 0;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: var(--bg-main);
            color: var(--text-main);
            font-family: "Inter", "Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
            -webkit-font-smoothing: antialiased;
        }
        .card {
            background: var(--bg-panel);
            border: 1px solid var(--border-color);
            padding: 48px;
            border-radius: 12px;
            box-shadow: 0 24px 64px rgba(0, 0, 0, 0.5);
            max-width: 440px;
            width: 100%;
            text-align: center;
            position: relative;
            overflow: hidden;
            animation: fadeIn 0.3s ease-out;
        }
        .card::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0;
            height: 2px;
            background: var(--accent-blue);
            opacity: 0.8;
        }
        .icon-wrapper {
            width: 56px; height: 56px;
            margin: 0 auto 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            font-size: 28px;
            font-weight: bold;
        }
        .icon-wrapper.success {
            color: var(--success);
            background: var(--success-bg);
            border: 1px solid var(--success-border);
        }
        .icon-wrapper.error {
            color: var(--error);
            background: var(--error-bg);
            border: 1px solid var(--error-border);
        }
        h1 {
            margin: 0 0 12px;
            font-size: 20px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        p {
            margin: 0;
            color: var(--text-muted);
            font-size: 13px;
            line-height: 1.6;
            font-weight: 500;
        }

        /* --- авто-закрытие --- */
        .auto-close {
            margin-top: 28px;
            padding-top: 20px;
            border-top: 1px solid var(--border-color);
            min-height: 60px; /* Чтобы карточка не прыгала */
        }
        .auto-close .countdown {
            font-size: 12px;
            color: var(--text-muted);
            margin: 0;
        }
        .auto-close .countdown strong {
            color: var(--text-main);
            font-weight: 600;
        }
        .btn-close {
            background: transparent;
            color: var(--text-main);
            border: 1px solid var(--border-color);
            padding: 10px 20px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            cursor: pointer;
            transition: background 0.15s, border-color 0.15s;
            font-family: inherit;
        }
        .btn-close:hover {
            background: var(--accent-blue);
            border-color: var(--accent-blue);
        }

        .fallback { display: none; }
        .fallback.visible { display: block; }
        .fallback .hint { margin: 0 0 12px; }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(8px); }
            to   { opacity: 1; transform: translateY(0); }
        }
    </style>
</head>
<body>
    <div class="card">
        {{if .Success}}
            <div class="icon-wrapper success">✓</div>
            <h1 style="color: var(--success);">{{.Page.Heading}}</h1>
        {{else}}
            <div class="icon-wrapper error">✕</div>
            <h1 style="color: var(--error);">{{.Page.Heading}}</h1>
        {{end}}
        <p>{{.Page.Message}}</p>

        {{if .Success}}
        <div class="auto-close">
            <p class="countdown" id="countdown">
                {{.AutoClose.Title}} <strong id="cd">5</strong> {{.AutoClose.TimeUnit}}
            </p>

            <div class="fallback" id="fallback">
                <p class="hint">{{.AutoClose.FallbackHint}}</p>
                <button class="btn-close" type="button" onclick="tryClose()">
                    {{.AutoClose.ButtonLabel}}
                </button>
            </div>
        </div>
        {{end}}
    </div>

    {{if .Success}}
    <script>
        (function () {
            var seconds = 5;
            var cdEl        = document.getElementById("cd");
            var countdownEl = document.getElementById("countdown");
            var fallbackEl  = document.getElementById("fallback");

            // Глобальная функция для кнопки
            window.tryClose = function() {
                try {
                    window.open('', '_self', '');
                    window.close();
                } catch (e) {
                    console.log("Close error:", e);
                }
            };

            function showFallback() {
                if (countdownEl) countdownEl.style.display = "none";
                if (fallbackEl)  fallbackEl.classList.add("visible");
            }

            function tick() {
                seconds -= 1;
                if (cdEl) cdEl.textContent = seconds;

                if (seconds > 0) {
                    setTimeout(tick, 1000);
                } else {
                    // Время вышло, пробуем закрыть
                    window.tryClose();
                    
                    // Если через 400мс мы всё ещё здесь — значит браузер заблокировал закрытие
                    setTimeout(showFallback, 400);
                }
            }

            setTimeout(tick, 1000);
        })();
    </script>
    {{end}}
</body>
</html>`))

func writePage(w http.ResponseWriter, status int, data pageData) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.WriteHeader(status)
	if err := callbackPageTmpl.Execute(w, data); err != nil {
		fmt.Fprintf(w, "render error: %v", err)
	}
}
