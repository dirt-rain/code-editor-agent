package utils

import (
	"errors"
	"fmt"
	"os"
)

// ReadFileNoThrowOnENOENT reads a file, returning nil if it doesn't exist
func ReadFileNoThrowOnENOENT(path string) ([]byte, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return nil, nil
		}
		return nil, err
	}
	return data, nil
}

// NormalizeToStringArray converts interface{} to []string
// Returns empty slice if value is nil/undefined
func NormalizeToStringArray(value interface{}, errorMessage string) ([]string, error) {
	if value == nil {
		return []string{}, nil
	}

	switch v := value.(type) {
	case string:
		return []string{v}, nil
	case []interface{}:
		result := make([]string, len(v))
		for i, item := range v {
			str, ok := item.(string)
			if !ok {
				return nil, fmt.Errorf(errorMessage)
			}
			result[i] = str
		}
		return result, nil
	case []string:
		return v, nil
	default:
		return nil, fmt.Errorf(errorMessage)
	}
}

// FileExists checks if a file exists
func FileExists(path string) bool {
	_, err := os.Stat(path)
	return err == nil
}
