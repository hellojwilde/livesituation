package parse

import (
	"fmt"
)

func Parse(s string) ([]map[string]string, error) {
	maps := make([]map[string]string, 0)
	for {
		m, i, err := parseObject(s)
		if err != nil {
			return nil, err
		}
		// len(m) == 0 implies
		// there were no fields
		// (just a "===")
		if len(m) > 0 {
			maps = append(maps, m)
		}
		s = s[i:]
		// fmt.Println(i, s)
		if len(s) == 0 {
			return maps, nil
		}
	}
}

var ctr uint64 = 0

func parseObject(s string) (map[string]string, int, error) {
	ret := make(map[string]string)
	// fmt.Println(ctr)
	// ctr++
	var i int
	var f lexer
	var err error
	for i, f, err = lexInit(0, s, ret); f != nil && err == nil && i < len(s); i, f, err = f(i, s, ret) {
	}
	return ret, i, err
}

type lexer func(i int, s string, m map[string]string) (int, lexer, error)

func lexInit(i int, s string, m map[string]string) (int, lexer, error) {
	idx := 0
	for j, c := range s[i:] {
		switch {
		case isAlphaNumeric(c):
			// On to the key!
			return i + idx, lexKey, nil
		case isWhitespace(c) || c == '\n':
			// Keep going
			idx = j + 1
		case c == '=':
			// We're done with this object
			return i + idx, lexObjectSeparator, nil
		default:
			return i + idx, nil, fmt.Errorf("Unexpected character %v: %q", idx+i, c)
		}
	}
	// We're done with the whole thing
	return len(s), nil, nil
}

func lexObjectSeparator(i int, s string, m map[string]string) (int, lexer, error) {
	if len(s[i:]) < 3 || (len(s[i:]) == 3 && s[i:] != "===") || (len(s[i:]) > 3 && s[i:i+4] != "===\n") {
		return i, nil, fmt.Errorf("Bad delimiter")
	}
	// Don't consume the newline
	// in case there's no trailing
	// newline (it's fine if there
	// is one because lexInit
	// ignores newlines)
	return i + 3, nil, nil
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
			key := s[i : i+j]
			idx = j + 1
			n, err := lexColonSeparator(i+idx, s)
			if err != nil {
				return i + idx + n, nil, err
			}
			return lexValue(i+idx+n, s, m, key)
		case c == '>':
			// We've found a multiline value
			// (intentionally consume the greater
			// than symbol)
			key := s[i : i+j]
			idx = j + 1
			n, err := lexGreaterThanSeparator(i+idx, s)
			if err != nil {
				return i + idx + n, nil, err
			}
			return lexMultilineValue(i+idx+n, s, m, key)
		default:
			return i + idx, nil, fmt.Errorf("Unexpected character %v: %q", i+idx, c)
		}
	}
	// We're done with the whole thing
	return len(s), nil, fmt.Errorf("Unexpected end of input")
}

func lexColonSeparator(i int, s string) (int, error) {
	idx := 0
	for j, c := range s[i:] {
		switch {
		case isWhitespace(c):
			// Keep going
			idx = j + 1
		default:
			return idx, nil
		}
	}
	// We're done with the whole thing
	return idx, fmt.Errorf("Unexpected end of input")
}

func lexGreaterThanSeparator(i int, s string) (int, error) {
	idx := 0
	if len(s[i:]) < 2 || s[i:i+2] != ">>" {
		return idx, fmt.Errorf("Expected >>>")
	}
	for j, c := range s[i+2:] {
		switch {
		case isWhitespace(c):
			// Keep going
			idx = j + 1
		case c == '\n':
			// Consume newline
			idx = j + 1
			return 2 + idx, nil
		default:
			return 2 + idx, nil
		}
	}
	// We're done with the whole thing
	return idx, fmt.Errorf("Unexpected end of input")
}

func lexValue(i int, s string, m map[string]string, key string) (int, lexer, error) {
	idx := 0
	for j, c := range s[i:] {
		switch {
		case c == '\n':
			value := s[i : i+idx]
			m[key] = value
			idx = j + 1
			return i + idx, lexInit, nil
		default:
			// Keep going
			// Assume ascii
			idx = j + 1
		}
	}
	// We're done with the whole thing
	return idx + i, nil, nil
}

func lexMultilineValue(i int, s string, m map[string]string, key string) (int, lexer, error) {
	idx := 0
	for j, c := range s[i:] {
		switch {
		case c == '\n':
			switch {
			case len(s[i+j:]) < 4:
				return i + idx, nil, fmt.Errorf("Unexpected end of input")
			case len(s[i+j:]) == 4:
				if s[i+j:] == "\n<<<" {
					value := s[i : i+j]
					m[key] = value
					idx = j + 4
					return i + idx, lexInit, nil
				}
				return i + idx, nil, fmt.Errorf("Unexpected end of input")
			default: // len > 4
				if s[i+j:i+j+5] == "\n<<<\n" {
					value := s[i : i+j]
					m[key] = value
					idx = j + 5
					return i + idx, lexInit, nil
				}
				// Keep going
				idx = j + 1
			}
		default:
			// Keep going
			// Assume ascii
			idx = j + 1
		}
	}
	// We're done with the whole thing
	return idx + i, nil, nil
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
