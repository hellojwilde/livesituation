package parse

import (
	"fmt"
)

func Parse(s string) ([]map[string]string, error) {
	return nil, nil
}

func parseObject(s string) (map[string]string, error) {
	ret := make(map[string]string)
	var i int
	var f lexer
	var err error
	for i, f, err = lexInit(0, s, ret); f != nil && err != nil && i < len(s); i, f, err = f(i, s, ret) {
	}
	return ret, err
}

type lexer func(i int, s string, m map[string]string) (int, lexer, error)

func lexInit(i int, s string, m map[string]string) (int, lexer, error) {
	idx := 0
	for j, c := range s[i:] {
		switch {
		case isAlphaNumeric(c):
			// On to the key!
			return idx + i, lexKey, nil
		case isWhitespace(c) || c == '\n':
			// Keep going
			idx = j
		case c == '=':
			// We're done with this object
			return idx + i, nil, nil
		default:
			return idx + i, nil, fmt.Errorf("Unexpected character: \"%c\"", c)
		}
	}
	// We're done with the whole thing
	return idx + i, nil, nil
}

// TODO: Actually store the key in the map
func lexKey(i int, s string, m map[string]string) (int, lexer, error) {
	idx := 0
	for j, c := range s[i:] {
		switch {
		case isAlphaNumeric(c):
			// Keep going
			idx = j
		case c == ':':
			// We've found a single-line value
			// (intentionally consume the colon)
			idx = j
			return idx + i, lexColonSeparator, nil
		case c == '>':
			// We've found a multiline value
			// (intentionally consume the greater
			// than symbol)
			idx = j
			return idx + i, lexGreaterThanSeparator, nil
		default:
			return idx + i, nil, fmt.Errorf("Unexpected character: \"%c\"", c)
		}
	}
	// We're done with the whole thing
	return idx + i, nil, fmt.Errorf("Unexpected end of input")
}

func isAlpha(c rune) bool {
	return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z')
}

func isNumeric(c rune) bool {
	return c >= '0' && c <= '9'
}

func isAlphaNumeric(c rune) bool {
	return isAlpha(c) || isNumeric(c)
}

func isWhitespace(c rune) bool {
	return c == ' ' || c == '\t'
}
