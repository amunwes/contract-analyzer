import React, { useRef, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

const PDFViewer = ({ renderedPages, onTextSelection }) => {
  const pdfContainerRef = useRef(null);

  useEffect(() => {
    if (renderedPages.length > 0 && pdfContainerRef.current) {
      const container = pdfContainerRef.current;
      container.innerHTML = '';

      renderedPages.forEach(({ pageNum, canvas, viewport, textContent }) => {
        // Create page wrapper
        const pageWrapper = document.createElement('div');
        pageWrapper.className = 'pdf-page-wrapper';
        pageWrapper.style.position = 'relative';
        pageWrapper.style.marginBottom = '20px';
        pageWrapper.style.backgroundColor = 'white';
        pageWrapper.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';

        // Add canvas
        pageWrapper.appendChild(canvas);

        // Create and add text layer
        const textLayerDiv = document.createElement('div');
        textLayerDiv.className = 'textLayer';
        textLayerDiv.style.width = `${viewport.width}px`;
        textLayerDiv.style.height = `${viewport.height}px`;
        
        pageWrapper.appendChild(textLayerDiv);

        // Render text layer
        const textLayer = new pdfjsLib.TextLayer({
            textContentSource: textContent,
            container: textLayerDiv,
            viewport: viewport
          });
          
          textLayer.render();

        container.appendChild(pageWrapper);
      });
    }
  }, [renderedPages]);

  return (
    <div 
      className="flex-1 bg-gray-200 rounded-lg shadow-lg p-4 overflow-auto" 
      style={{ maxHeight: '85vh' }}
      onMouseUp={onTextSelection}
    >
      <div ref={pdfContainerRef} />
    </div>
  );
};

export default PDFViewer;