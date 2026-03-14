package config

import (
	"fmt"
	"os"

	"github.com/ilyakaznacheev/cleanenv"
)

type Config struct {
	*HTTPServer `yaml:"http_server"`
}

type HTTPServer struct {
	Port string `yaml:"port"`
}

func MustLoad(configPath string) (*Config, error) {
	if _, err := os.Stat(configPath); os.IsNotExist(err) {
		return nil, fmt.Errorf("config file '%s' not found. err: %s", configPath, err)
	}

	var cfg Config
	if err := cleanenv.ReadConfig(configPath, &cfg); err != nil {
		return nil, fmt.Errorf("error reading config: %s", err)
	}

	return &cfg, nil
}
