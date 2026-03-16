package config

import (
	"fmt"
	"time"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

func SetupLogger() (*zap.Logger, error) {
	loggerConfig := zap.NewProductionConfig()
	loggerConfig.DisableCaller = true
	loggerConfig.DisableStacktrace = true
	loggerConfig.EncoderConfig.EncodeTime = zapcore.TimeEncoderOfLayout(time.DateTime)

	logger, err := loggerConfig.Build()
	if err != nil {
		return nil, fmt.Errorf("failed to build logger: %w", err)
	}

	return logger, nil
}
