package frontend

import (
	"main_module/constants"
	"net/http"
)

func init() {
	http.HandleFunc("/", handler404)
}

func handler404(w http.ResponseWriter, r *http.Request) {
	h := w.Header()
	h.Add(http.CanonicalHeaderKey("Content-Type"), "text/html")
	w.WriteHeader(http.StatusNotFound)
	http.ServeFile(w, r, constants.Path404)
}
