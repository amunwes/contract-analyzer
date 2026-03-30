import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export const extractTextFromPDF = async (file) => {
  try {
    console.log("Starting PDF extraction...");
    const arrayBuffer = await file.arrayBuffer();

    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    console.log("PDF loaded, pages:", pdf.numPages);

    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item) => item.str).join(" ");
      fullText += `\n--- Page ${i} ---\n${pageText}\n`;
    }

    console.log("Text extracted successfully, length:", fullText.length);
    return { pdf, fullText };
  } catch (error) {
    console.error("Error extracting text:", error);
    throw error;
  }
};

export const renderAllPages = async (pdfDoc, scale = 1.5) => {
  if (!pdfDoc) return [];

  const pages = [];

  for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
    try {
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale });

      // Create canvas
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise;

      // Get text content
      const textContent = await page.getTextContent();

      pages.push({
        pageNum,
        canvas,
        viewport,
        textContent,
      });
    } catch (error) {
      console.error(`Error rendering page ${pageNum}:`, error);
    }
  }

  return pages;
};

// NEW: Find passages containing keywords
export const findKeywordPassages = async (pdfDoc, keywords) => {
  if (!pdfDoc) return [];

  const passages = [];
  const keywordsLower = keywords.map((k) => k.toLowerCase());

  for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
    try {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();

      // Group text items into lines based on vertical position
      const lines = [];
      let currentLine = [];
      let lastY = null;

      textContent.items.forEach((item) => {
        const y = item.transform[5]; // Y position

        // If Y position changed significantly, start a new line
        if (lastY !== null && Math.abs(y - lastY) > 5) {
          if (currentLine.length > 0) {
            lines.push(currentLine.join(" "));
          }
          currentLine = [item.str];
        } else {
          currentLine.push(item.str);
        }
        lastY = y;
      });

      // Don't forget the last line
      if (currentLine.length > 0) {
        lines.push(currentLine.join(" "));
      }

      // Check each line for keywords
      lines.forEach((line, lineIndex) => {
        const lineLower = line.toLowerCase();
        const foundKeywords = keywordsLower.filter((keyword) =>
          lineLower.includes(keyword),
        );

        if (foundKeywords.length > 0) {
          passages.push({
            id: `${pageNum}-${lineIndex}`,
            page: pageNum,
            text: line.trim(),
            keywords: foundKeywords,
            timestamp: new Date().toLocaleString(),
          });
        }
      });
    } catch (error) {
      console.error(`Error finding keywords on page ${pageNum}:`, error);
    }
  }

  console.log(
    `Found ${passages.length} passages containing keywords:`,
    keywords,
  );
  return passages;
};
