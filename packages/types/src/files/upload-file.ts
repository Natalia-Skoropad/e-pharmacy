export type UploadFileValue = Readonly<{
  id: string;
  name: string;
  size: number;
  type: string;
  file?: File;
  dataUrl?: string;
}>;
