package util

import (
	"testing"
)

func TestGetURLEnd(t *testing.T) {
	values := []string{
		GetURLEnd(""), "",
		GetURLEnd("foo"), "foo",
		GetURLEnd("/foo"), "foo",
		GetURLEnd("/foo/"), "",
		GetURLEnd("/foo/bar"), "bar",
		GetURLEnd("/foo/bar/"), "",
	}
	for i := 0; i < len(values); i += 2 {
		if values[i] != values[i+1] {
			t.Errorf("Expected %s; got %s", values[i+1], values[i])
		}
	}
}
