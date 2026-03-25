package maputil

func MapToSlice[K comparable, V any](in map[K]V) []V {
	out := make([]V, len(in))
	for _, val := range in {
		out = append(out, val)
	}
	return out
}
