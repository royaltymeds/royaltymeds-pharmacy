"use client";

import { useState, useEffect, useRef } from "react";
import { Download, X } from "lucide-react";

interface PrescriptionFileViewerProps {
  fileUrl: string;
  prescriptionId: string;
  isAdmin?: boolean;
}

export default function PrescriptionFileViewer({
  fileUrl,
  prescriptionId,
  isAdmin = false,
}: PrescriptionFileViewerProps) {
  const [fileViewerOpen, setFileViewerOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [fitZoom, setFitZoom] = useState(100);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const [panStartX, setPanStartX] = useState(0);
  const [panStartY, setPanStartY] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const handleZoomIn = () => {
    setZoomLevel(Math.min(zoomLevel + 10, 300));
  };

  const handleZoomOut = () => {
    setZoomLevel(Math.max(zoomLevel - 10, fitZoom));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel > 100) {
      setIsPanning(true);
      setPanStartX(e.clientX - panX);
      setPanStartY(e.clientY - panY);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning && zoomLevel > 100) {
      setPanX(e.clientX - panStartX);
      setPanY(e.clientY - panStartY);
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleDownloadFile = async () => {
    if (!fileUrl) return;
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `prescription-${prescriptionId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading file:", error);
    }
  };

  useEffect(() => {
    if (fileViewerOpen && imgRef.current && containerRef.current) {
      const calculateFitZoom = () => {
        const img = imgRef.current;
        const container = containerRef.current;
        if (!img || !container) return;

        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        const imgWidth = img.naturalWidth;
        const imgHeight = img.naturalHeight;

        if (imgWidth === 0 || imgHeight === 0) {
          setFitZoom(100);
          setZoomLevel(100);
          return;
        }

        const scaleX = (containerWidth - 40) / imgWidth; // 40px padding
        const scaleY = (containerHeight - 40) / imgHeight;
        const calculatedZoom = Math.min(scaleX, scaleY) * 100;
        
        const zoomToUse = Math.max(Math.min(calculatedZoom, 100), 50);
        setFitZoom(zoomToUse);
        setZoomLevel(zoomToUse);
        setPanX(0);
        setPanY(0);
      };

      const img = imgRef.current;
      if (img.complete) {
        calculateFitZoom();
      } else {
        img.addEventListener("load", calculateFitZoom);
        return () => img.removeEventListener("load", calculateFitZoom);
      }
    }
  }, [fileViewerOpen]);

  return (
    <>
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Prescription File
        </h2>

        {/* Thumbnail Preview */}
        <div
          className="mb-4 border border-gray-200 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center"
          style={{ height: "200px" }}
        >
          {fileUrl.includes(".pdf") ? (
            <div className="text-center">
              <Download className="w-12 h-12 text-red-500 mx-auto mb-2" />
              <p className="text-sm text-gray-600">PDF Document</p>
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={fileUrl}
              alt="Prescription preview"
              className="w-full h-full object-contain"
            />
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setFileViewerOpen(true)}
            className="inline-flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition text-sm"
          >
            <Download className="w-4 h-4" />
            View File
          </button>
          {isAdmin && (
            <button
              onClick={handleDownloadFile}
              className="inline-flex items-center gap-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition text-sm"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          )}
        </div>
      </div>

      {/* File Viewer Modal */}
      {fileViewerOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-6xl h-auto max-h-[90vh] flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Prescription File Viewer
              </h3>
              <button
                onClick={() => {
                  setFileViewerOpen(false);
                  setZoomLevel(100);
                  setPanX(0);
                  setPanY(0);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-2 p-3 bg-gray-100 border-b border-gray-200">
              <button
                onClick={handleZoomOut}
                className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm font-medium"
              >
                −
              </button>
              <span className="text-sm font-medium text-gray-700 w-12 text-center">
                {zoomLevel}%
              </span>
              <button
                onClick={handleZoomIn}
                className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm font-medium"
              >
                +
              </button>
              <div className="flex-1" />
              {isAdmin && (
                <button
                  onClick={handleDownloadFile}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium flex items-center gap-1"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              )}
            </div>

            {/* Content */}
            <div
              ref={containerRef}
              className="flex-1 overflow-hidden bg-gray-200 flex items-center justify-center relative"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              style={{
                cursor: isPanning ? "grabbing" : zoomLevel > fitZoom ? "grab" : "auto",
              }}
            >
              {fileUrl.includes(".pdf") ? (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center text-white">
                    <Download className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">PDF files cannot be previewed in the modal</p>
                    <p className="text-sm text-gray-300 mt-2">Use the Download button to view the file</p>
                  </div>
                </div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  ref={imgRef}
                  src={fileUrl}
                  alt="Prescription full view"
                  style={{
                    transform: `scale(${zoomLevel / 100}) translate(${panX}px, ${panY}px)`,
                    transformOrigin: "center center",
                    transition: isPanning ? "none" : "transform 0.2s",
                    maxWidth: "100%",
                    maxHeight: "100%",
                  }}
                  className="w-full h-full object-contain"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
