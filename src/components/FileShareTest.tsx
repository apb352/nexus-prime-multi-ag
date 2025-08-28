import React, { useState } from 'react';
import { FileUploadButton, QuickFileButtons } from './FileUpload';
import { AttachmentList } from './AttachmentPreview';
import { FileAttachment } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function FileShareTest() {
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);

  const handleFileSelect = (newAttachments: FileAttachment[]) => {
    setAttachments(prev => [...prev, ...newAttachments]);
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const handleClearAll = () => {
    setAttachments([]);
  };

  return (
    <Card className="p-4 w-96">
      <h3 className="text-lg font-semibold mb-4">File Sharing Test</h3>
      
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium mb-2">Upload Files</h4>
          <div className="flex gap-2">
            <FileUploadButton onFileSelect={handleFileSelect} />
            <QuickFileButtons onFileSelect={handleFileSelect} />
          </div>
        </div>

        {attachments.length > 0 && (
          <div>
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium">
                Attachments ({attachments.length})
              </h4>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleClearAll}
              >
                Clear All
              </Button>
            </div>
            
            <AttachmentList
              attachments={attachments}
              onRemove={handleRemoveAttachment}
              className="max-h-60 overflow-y-auto"
            />
          </div>
        )}

        {attachments.length === 0 && (
          <div className="text-center text-muted-foreground text-sm py-8">
            No files attached. Try uploading some files!
          </div>
        )}
      </div>
    </Card>
  );
}