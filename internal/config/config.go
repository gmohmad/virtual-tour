package config

import (
	"fmt"
	"os"

	"github.com/gmohmad/diploma/pkg/envutil"
	"github.com/ilyakaznacheev/cleanenv"
)

type Config struct {
	Env         string `yaml:"env"`
	*HTTPServer `yaml:"http_server"`
	*DB
}

type HTTPServer struct {
	Address string `yaml:"address"`
}

type DB struct {
	Host           string
	Port           string
	User           string
	Password       string
	DBName         string
	SSLMode        string
	MigrationsPath string
}

func MustLoad(configPath string) (*Config, error) {
	if _, err := os.Stat(configPath); os.IsNotExist(err) {
		return nil, fmt.Errorf("config file '%s' not found. err: %s", configPath, err)
	}

	var cfg Config
	if err := cleanenv.ReadConfig(configPath, &cfg); err != nil {
		return nil, fmt.Errorf("error reading config: %s", err)
	}

	cfg.DB = &DB{
		Host:           envutil.GetEnvOrFatal("POSTGRES_HOST"),
		Port:           envutil.GetEnvOrFatal("POSTGRES_PORT"),
		User:           envutil.GetEnvOrFatal("POSTGRES_USER"),
		Password:       envutil.GetEnvOrFatal("POSTGRES_PASSWORD"),
		DBName:         envutil.GetEnvOrFatal("POSTGRES_DB"),
		SSLMode:        envutil.GetEnvOrFatal("SSL_MODE"),
		MigrationsPath: envutil.GetEnvOrFatal("MIGRATIONS_PATH"),
	}

	return &cfg, nil
}
