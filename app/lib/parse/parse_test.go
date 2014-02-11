package parse

import (
	"fmt"
	"testing"
)

var ts1 = `title: This is a title
woot>>>
multiline
stuff with a "quote"
<<<`

var ts2 = `title: This is a title
woot>>>

multiline
stuff with a "quote"
<<<
`
var ts3 = `title:   

woot>>>

multiline
stuff with a "quote"
<<<
`

var ts4 = `title:test1
===
title:test2
===
===
title:test3
`

func TestParse1(t *testing.T) {
	testParse(t, ts1, ts2, ts3, ts4)
}

func testParse(t *testing.T, s ...string) {
	for _, s := range s {
		m, err := Parse(s)
		if err != nil {
			fmt.Println(err)
		} else {
			fmt.Println(toSmapSlice(m))
		}
	}
}

type str string

func (s str) String() string {
	return fmt.Sprintf("%q", string(s))
}

type smap map[str]str

func toSmap(m map[string]string) smap {
	s := make(smap)
	for k, v := range m {
		s[str(k)] = str(v)
	}
	return s
}

func toSmapSlice(m []map[string]string) []smap {
	s := make([]smap, 0)
	for _, v := range m {
		s = append(s, toSmap(v))
	}
	return s
}
