package pages

var Ru = Pages{
	Success: Page{
		Title:   "Авторизация успешна",
		Heading: "Готово!",
		Message: "Вкладка закроется автоматически. Можете вернуться в приложение.",
	},
	ErrorCantAuth: Page{
		Title:   "Ошибка авторизации",
		Heading: "Не удалось авторизоваться",
		Message: "Закройте вкладку и попробуйте снова.",
	},
	ErrorDontGetCode: Page{
		Title:   "Ошибка авторизации",
		Heading: "Код не получен",
		Message: "Закройте вкладку и попробуйте снова.",
	},
	ErrorNoPage: Page{
		Title:   "Нет страницы",
		Heading: "Такой страницы не существует",
		Message: "Закройте вкладку и попробуйте снова.",
	},
	AutoClose: AutoClose{
		Title:        "Автоматическое закрытие через",
		FallbackHint: "Браузер не позволил закрыть вкладку автоматически — закройте её вручную.",
		TimeUnit:     "c.",
		ButtonLabel:  "Закрыть",
	},
}
