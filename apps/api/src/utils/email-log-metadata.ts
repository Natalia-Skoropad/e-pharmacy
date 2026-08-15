type EmailLogMetadataInput = {
  to: string;
  subject: string;
};

//===============================================================

export function createSafeEmailLogMetadata(
  from: string,
  options: EmailLogMetadataInput
): {
  from: string;
  to: string;
  subject: string;
} {
  return {
    from,
    to: options.to,
    subject: options.subject,
  };
}
