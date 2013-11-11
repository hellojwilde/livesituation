package util

// Returns the trailing part of
// a url, as separated by slashes.
// For example, GetURLEnd("/hi")
// returns "hi", whereas
// GetURLEnd("/hi/") returns "".
// GetURLEnd("") returns "".
func GetURLEnd(url string) string {
	if len(url) == 0 {
		return ""
	}
	firstChar := len(url) - 1
	for firstChar >= 0 && url[firstChar] != '/' {
		firstChar--
	}
	return url[firstChar+1:]
}
