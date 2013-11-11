package api

import (
	"fmt"
	"html"
	"net/http"
)

func handlerDocs(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path == "/api/docs/" {
		// List docs request
		switch r.Method {
		case "GET":
			fmt.Fprintf(w, "GET %s (list)", html.EscapeString(r.URL.Path))
		default:
			http.Error(w, fmt.Sprintf("Unsupported method: %s", r.Method), http.StatusMethodNotAllowed)
		}
	} else {
		// Specific doc request

		// Get subset of URL after /api/docs/
		docname := r.URL.Path[len("/api/docs/"):]
		switch r.Method {
		case "GET":
			fmt.Fprintf(w, "GET %s (get specific doc: %s)", html.EscapeString(r.URL.Path), docname)
		case "PUT":
			fmt.Fprintf(w, "GET %s (put new doc: %s)", html.EscapeString(r.URL.Path), docname)
		case "POST":
			fmt.Fprintf(w, "GET %s (post op to doc: %s)", html.EscapeString(r.URL.Path), docname)
		default:
			http.Error(w, fmt.Sprintf("Unsupported method: %s", r.Method), http.StatusMethodNotAllowed)
		}
	}
}
