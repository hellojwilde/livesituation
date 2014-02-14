package main_module

import (
	"appengine"
	"fmt"
	"io/ioutil"
	"net/http"
)

const (
	name = "n"
)

func init() {
	http.HandleFunc("/", handler)
}

func handler(w http.ResponseWriter, r *http.Request) {
	c := appengine.NewContext(r)
	values := r.URL.Query()
	switch r.Method {
	case "GET":
		n, ok := values[name]
		if !ok {
			http.Error(w, "Required parameter: "+name, http.StatusBadRequest)
			return
		}
		s, err := get(c, n[0])
		if err != nil {
			http.Error(w, fmt.Sprintf("Error retrieving document: %v", err), http.StatusInternalServerError)
			return
		}
		fmt.Fprint(w, s)
	case "POST":
		n, ok := values[name]
		if !ok {
			http.Error(w, "Required parameter: "+name, http.StatusBadRequest)
			return
		}
		bytes, err := ioutil.ReadAll(r.Body)
		if err != nil {
			http.Error(w, fmt.Sprintf("Error reading request: %v", err), http.StatusInternalServerError)
			return
		}
		err = post(c, n[0], string(bytes))
		if err != nil {
			http.Error(w, fmt.Sprintf("Error processing request: %v", err), http.StatusInternalServerError)
			return
		}
	default:
	}
}
