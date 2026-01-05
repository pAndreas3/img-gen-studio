import React, { useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import * as Tiff from 'tiff';

// Define the props expected by the Dropzone component
interface DropzoneProps {
    onChange: React.Dispatch<React.SetStateAction<string[]>>;
    className?: string;
    fileExtensions: string[];
}

// Create the Dropzone component receiving props
export function Dropzone({
    onChange,
    className,
    fileExtensions,
    ...props
}: DropzoneProps) {
    // Initialize state variables using the useState hook
    const fileInputRef = useRef<HTMLInputElement | null>(null); // Reference to file input element
    const [fileInfo, setFileInfo] = useState<string | null>(null); // Information about the uploaded file
    const [error, setError] = useState<string | null>(null); // Error message state


    // Function to handle drag over event
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    // Function to handle drop event
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        const { files } = e.dataTransfer;
        handleFiles(files);
    };

    // Function to handle file input change event
    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { files } = e.target;
        if (files) {
            handleFiles(files);
        }
    };

    // Function to handle processing of uploaded files
    const handleFiles = (files: FileList) => {
        const uploadedFile = files[0];
        if (!uploadedFile) return;

        // Get the file extension
        const fileExtension = uploadedFile.name.split('.').pop();

        // Check file extension
        if (!fileExtension || !fileExtensions.includes(fileExtension)) {
            setError(`Invalid file type. Allowed types: .${fileExtensions.join(', .')}`);
            return;
        }

        const fileSizeInKB = Math.round(uploadedFile.size / 1024); // Convert to KB

        if (fileExtension === 'tiff' || fileExtension === 'tif') {
            // Convert TIFF to JPEG
            const reader = new FileReader();
            reader.onload = (e) => {
                const tiff = Tiff.decode(e.target?.result as ArrayBuffer)[0];
                const canvas = document.createElement('canvas');
                canvas.width = tiff.width;
                canvas.height = tiff.height;
                const ctx = canvas.getContext('2d');
                const imageData = ctx?.createImageData(tiff.width, tiff.height);
                imageData?.data.set(tiff.data);
                ctx?.putImageData(imageData!, 0, 0);
                canvas.toBlob((blob: any) => {
                    const url = URL.createObjectURL(blob);
                    onChange(() => [url]);
                }, 'image/jpeg');
            };
            reader.readAsArrayBuffer(uploadedFile);
        } else {
            const fileList = Array.from(files).map((file) => URL.createObjectURL(file));
            onChange(() => [...fileList]);
        }

        // Display file information
        setFileInfo(`Uploaded file: ${uploadedFile.name} (${fileSizeInKB} KB)`);
        setError(null); // Reset error state
    };

    // Function to simulate a click on the file input element
    const handleButtonClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    return (
        <Card
            className={`border-2 border-dashed bg-muted hover:cursor-pointer border-muted-foreground/50 ${className}`}
            {...props}
            onClick={handleButtonClick}
        >
            <CardContent
                className="flex flex-col items-center justify-center space-y-2 px-2 py-4 text-xs"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
            >
                <div className="flex items-center justify-center text-muted-foreground" >
                    <span className="font-medium">Drag Files or Click to Upload </span>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept={fileExtensions.map(ext => '.' + ext).join(',')}
                        onChange={handleFileInputChange}
                        className="hidden"
                    />
                </div>
                {fileInfo && <p className="text-muted-foreground">{fileInfo}</p>}
                {error && <span className="text-red-500">{error}</span>}
            </CardContent>
        </Card >
    );
}