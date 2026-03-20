package filemanager

import (
	"fmt"
	"io"
	"mime/multipart"
	"path"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/credentials"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/s3"
	"github.com/aws/aws-sdk-go/service/s3/s3manager"
	"github.com/google/uuid"
)

type S3Provider struct {
	config  *aws.Config
	session *session.Session
}

func NewS3Provider(host, accessKey, secretKey string) (*S3Provider, error) {
	cfg := aws.NewConfig().
		WithCredentials(credentials.NewStaticCredentials(accessKey, secretKey, "")).
		WithEndpoint(host).
		WithRegion("us-east-1").
		WithDisableSSL(true).
		WithS3ForcePathStyle(true)

	sess, err := session.NewSessionWithOptions(session.Options{
		Config:            *cfg,
		SharedConfigState: session.SharedConfigDisable,
	})
	if err != nil {
		return nil, err
	}
	return &S3Provider{config: cfg, session: sess}, nil
}

func (p *S3Provider) Download(key, bucket string) ([]byte, error) {
	buf := aws.NewWriteAtBuffer([]byte{})
	if _, err := s3manager.NewDownloader(p.session).Download(buf, &s3.GetObjectInput{
		Key:    aws.String(key),
		Bucket: aws.String(bucket),
	}); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

func (p *S3Provider) Upload(key, bucket string, r io.Reader) error {
	_, err := s3manager.NewUploader(p.session).
		Upload(&s3manager.UploadInput{
			Body:   r,
			Key:    aws.String(key),
			Bucket: aws.String(bucket),
		})
	return err
}

func (p *S3Provider) DeleteFiles(bucket string, keys []string) error {
	s3Client := s3.New(p.session)
	objects := make([]*s3.ObjectIdentifier, 0, len(keys))
	for _, key := range keys {
		objects = append(objects, &s3.ObjectIdentifier{Key: aws.String(key)})
	}
	if _, err := s3Client.DeleteObjects(&s3.DeleteObjectsInput{
		Bucket: aws.String(bucket),
		Delete: &s3.Delete{
			Objects: objects,
		},
	}); err != nil {
		return fmt.Errorf("failed to delete file: %w", err)
	}
	return nil
}

func (s *S3Provider) UploadFilesFromMultipart(m *multipart.Form, s3bucket, s3path, companyID string) ([]string, error) {
	uploaded := make([]string, 0)

	for fieldName, headers := range m.File {
		if len(headers) == 0 {
			continue
		}
		fileHeader := headers[0]
		file, err := fileHeader.Open()
		if err != nil {
			s.DeleteFiles(s3bucket, uploaded)
			return nil, fmt.Errorf("failed to open file %s: %w", fieldName, err)
		}
		defer file.Close()

		filename := uuid.New().String() + path.Ext(fileHeader.Filename)
		path := path.Join(s3path, companyID, filename)
		if err := s.Upload(path, s3bucket, file); err != nil {
			s.DeleteFiles(s3bucket, uploaded)
			return nil, fmt.Errorf("failed to upload file %s: %w", filename, err)
		}
		uploaded = append(uploaded, path)
	}
	return uploaded, nil
}
