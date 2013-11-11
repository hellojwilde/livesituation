package api

import (
	"net/http"
)

func init() {
	http.HandleFunc("/api/docs/", handlerDocs)
}
