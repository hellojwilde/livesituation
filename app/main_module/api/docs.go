package api

import (
	"fmt"
	"html"
	"net/http"
)

func handlerDocs(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, "api/handlerDocs: %v", html.EscapeString(r.URL.Path))
}
