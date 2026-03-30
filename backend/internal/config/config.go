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
	*S3         `yaml:"s3"`
	*DB         `yaml:"db"`
}

type HTTPServer struct {
	LiveTourAddress string `yaml:"livetour_address"`
	AppAddress      string `yaml:"app_address"`
}

type DB struct {
	Host           string `yaml:"host"`
	SSLMode        string `yaml:"ssl_mode"`
	MigrationsPath string `yaml:"migrations_path"`
	DBName         string
	User           string
	Password       string
}

type S3 struct {
	Host       string `yaml:"host"`
	Bucket     string `yaml:"bucket"`
	ImagesPath string `yaml:"images_path"`
}

func MustLoad(configPath string) (*Config, error) {
	if _, err := os.Stat(configPath); os.IsNotExist(err) {
		return nil, fmt.Errorf("config file '%s' not found. err: %s", configPath, err)
	}

	var cfg Config
	if err := cleanenv.ReadConfig(configPath, &cfg); err != nil {
		return nil, fmt.Errorf("error reading config: %s", err)
	}

	cfg.DB.User = envutil.GetEnvOrFatal("POSTGRES_USER")
	cfg.DB.Password = envutil.GetEnvOrFatal("POSTGRES_PASSWORD")
	cfg.DB.DBName = envutil.GetEnvOrFatal("POSTGRES_DB")

	return &cfg, nil
}
