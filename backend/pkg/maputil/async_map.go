package maputil

import "sync"

type AsyncMap[K comparable, V any] struct {
	data map[K]V
	m    *sync.RWMutex
}

func NewAsyncMap[K comparable, V any]() *AsyncMap[K, V] {
	return &AsyncMap[K, V]{
		data: make(map[K]V),
		m:    new(sync.RWMutex),
	}
}

func (am *AsyncMap[K, V]) Get(key K) (V, bool) {
	am.m.RLock()
	val, ok := am.data[key]
	am.m.RUnlock()
	return val, ok
}

func (am *AsyncMap[K, V]) Set(key K, value V) {
	am.m.Lock()
	am.data[key] = value
	am.m.Unlock()
}

func (am *AsyncMap[K, V]) Del(key K) {
	am.m.Lock()
	delete(am.data, key)
	am.m.Unlock()
}

func (am *AsyncMap[K, V]) Range(f func(key K, value V)) {
	am.m.RLock()
	for key, value := range am.data {
		f(key, value)
	}
	am.m.RUnlock()
}

func (am *AsyncMap[K, V]) Reset() {
	am.m.Lock()
	am.data = make(map[K]V)
	am.m.Unlock()
}
