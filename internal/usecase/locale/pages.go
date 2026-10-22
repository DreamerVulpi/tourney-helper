package locale

import "github.com/dreamervulpi/tourney-helper/internal/entity/locale/pages"

var pagesByLang = map[Lang]pages.Pages{
	RU: pages.Ru,
	EN: pages.En,
}

func PagesFor(lang Lang) pages.Pages {
	if p, ok := pagesByLang[lang]; ok {
		return p
	}
	return pages.En
}
