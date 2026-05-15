export default ({ env }) => {
  const provider = env('UPLOAD_PROVIDER', 'local');

  if (provider !== 'aws-s3') {
    return {};
  }

  return {
    upload: {
      config: {
        provider: 'aws-s3',
        providerOptions: {
          credentials: {
            accessKeyId: env('S3_ACCESS_KEY_ID'),
            secretAccessKey: env('S3_SECRET_ACCESS_KEY'),
          },
          region: env('S3_REGION', 'us-east-1'),
          params: {
            Bucket: env('S3_BUCKET', 'strapi-media'),
          },
          ...(env('S3_ENDPOINT')
            ? {
                endpoint: env('S3_ENDPOINT'),
                forcePathStyle: true,
              }
            : {}),
        },
        actionOptions: {
          upload: {},
          uploadStream: {},
          delete: {},
        },
      },
    },
  };
};
