package main_module

import (
	"appengine"
	"appengine/datastore"
	"encoding/json"
	"lib/parse"
	"sync"
)

type pair struct {
	s   string
	err error
}

var cache struct {
	m map[string]pair
	sync.RWMutex
}

func get(c appengine.Context, name string) (string, error) {
	cache.RLock()
	p, ok := cache.m[name]
	cache.RUnlock()
	if !ok {
		// TODO: Retrieve string
		// s, err := toJSON(name)
		s, err := getFromStore(c, name)
		cache.Lock()
		p = pair{s, err}
		cache.m[name] = p
		cache.Unlock()
	}
	return p.s, p.err
}

func post(c appengine.Context, name, value string) error {
	// if err := putDocumentInStore(c, name, value); err != nil {
	// 	return err
	// }
	s, err := toJSON(value)
	if err != nil {
		return err
	}
	cache.Lock()
	cache.m[name] = pair{s, nil}
	// delete(cache.m, name)
	cache.Unlock()
	return nil
}

func putDocumentInStore(c appengine.Context, name, value string) error {
	s, err := toJSON(value)
	if err != nil {
		return err
	}
	return putInStore(c, name, s)
}

type strng struct {
	string
}

func getFromStore(c appengine.Context, name string) (string, error) {
	k := datastore.NewIncompleteKey(c, name, nil)
	var s strng
	err := datastore.Get(c, k, &s)
	return s.string, err
}

func putInStore(c appengine.Context, name, value string) error {
	_, err := datastore.Put(c, datastore.NewIncompleteKey(c, name, nil), strng{value})
	return err
}

func toJSON(s string) (string, error) {
	var m []map[string]string
	var err error
	m, err = parse.Parse(s)
	if err != nil {
		return "", err
	}
	b, err := json.Marshal(m)
	if err != nil {
		return "", err
	}
	return string(b), nil
}

func init() {
	cache.m = make(map[string]pair)
}
