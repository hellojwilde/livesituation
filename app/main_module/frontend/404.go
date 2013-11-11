package frontend

import (
	// "fmt"
	"main_module/constants"
	"net/http"
	// "os"
	// "runtime"
)

func init() {
	http.HandleFunc("/", handler404)
}

func handler404(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusNotFound)
	// f, err := os.Open(constants.Path404)
	// if err != nil {

	// }
	// var b [512]byte
	// n, _ := f.Read(b[:])
	// typ := http.DetectContentType(b[:n])
	// h := w.Header()
	// h.Add(key, value)
	http.ServeFile(w, r, constants.Path404)
}
