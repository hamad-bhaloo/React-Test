import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, File, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FileUploadProps {
  quotationId?: string;
  attachments: any[];
  onAttachmentsChange: (attachments: any[]) => void;
  maxFiles?: number;
  maxSize?: number; // in MB
}

const FileUpload = ({ 
  quotationId, 
  attachments, 
  onAttachmentsChange, 
  maxFiles = 5,
  maxSize = 10 
}: FileUploadProps) => {
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (attachments.length + acceptedFiles.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const uploadPromises = acceptedFiles.map(async (file) => {
        // Check file size
        if (file.size > maxSize * 1024 * 1024) {
          throw new Error(`File ${file.name} is too large. Maximum size is ${maxSize}MB`);
        }

        // Generate unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from('quotation-attachments')
          .upload(fileName, file);

        if (error) throw error;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('quotation-attachments')
          .getPublicUrl(fileName);

        return {
          id: Date.now() + Math.random(),
          name: file.name,
          size: file.size,
          type: file.type,
          url: publicUrl,
          path: fileName,
          uploaded_at: new Date().toISOString(),
        };
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      const newAttachments = [...attachments, ...uploadedFiles];
      onAttachmentsChange(newAttachments);

      toast.success(`${uploadedFiles.length} file(s) uploaded successfully`);
    } catch (error: any) {
      console.error('Error uploading files:', error);
      toast.error(error.message || 'Failed to upload files');
    } finally {
      setUploading(false);
    }
  }, [attachments, onAttachmentsChange, maxFiles, maxSize]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: maxFiles - attachments.length,
    maxSize: maxSize * 1024 * 1024,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
      'text/plain': ['.txt'],
    },
  });

  const removeAttachment = async (attachment: any) => {
    try {
      // Delete from storage if it was uploaded
      if (attachment.path) {
        await supabase.storage
          .from('quotation-attachments')
          .remove([attachment.path]);
      }

      const newAttachments = attachments.filter(a => a.id !== attachment.id);
      onAttachmentsChange(newAttachments);
      toast.success('File removed successfully');
    } catch (error) {
      console.error('Error removing file:', error);
      toast.error('Failed to remove file');
    }
  };

  const downloadAttachment = (attachment: any) => {
    if (attachment.url) {
      window.open(attachment.url, '_blank');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive 
            ? 'border-primary bg-primary/5' 
            : 'border-gray-300 hover:border-gray-400'
        } ${uploading ? 'pointer-events-none opacity-50' : ''}`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        {isDragActive ? (
          <p className="text-primary">Drop files here...</p>
        ) : (
          <div>
            <p className="text-gray-600 mb-2">
              {uploading ? 'Uploading...' : 'Drag & drop files here, or click to select'}
            </p>
            <p className="text-sm text-gray-500">
              PDF, DOC, DOCX, XLS, XLSX, Images, TXT (max {maxSize}MB each, {maxFiles} files total)
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {attachments.length}/{maxFiles} files uploaded
            </p>
          </div>
        )}
      </div>

      {attachments.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium">Attached Files:</h4>
          {attachments.map((attachment) => (
            <Card key={attachment.id}>
              <CardContent className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  <File className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">{attachment.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(attachment.size)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => downloadAttachment(attachment)}
                    className="h-8 w-8 p-0"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAttachment(attachment)}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;