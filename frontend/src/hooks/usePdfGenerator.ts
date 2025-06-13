import { useState, useCallback } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useToast } from '@/hooks/use-toast'; // Assuming you have a useToast hook

interface PdfOptions {
  filename: string;
  elementId: string;
  studentName?: string;
  assignmentTitle?: string;
}

export const usePdfGenerator = () => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const { toast } = useToast();

  const handleDownloadPdf = useCallback(async ({ filename, elementId, studentName, assignmentTitle }: PdfOptions) => {
    setIsGeneratingPdf(true);
    try {
      const input = document.getElementById(elementId);

      if (!input) {
        console.error(`Element with ID '${elementId}' not found for PDF generation.`);
        toast({
          title: "PDF Generation Failed",
          description: "The content to generate PDF from could not be found.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Generating PDF",
        description: "Please wait while your report is being generated...",
        variant: "default",
      });

      // Temporarily hide elements that might interfere with PDF generation if needed
      // For this specific use case (modal content), it's usually fine, but keep in mind
      // e.g., const buttons = input.querySelectorAll('button'); buttons.forEach(btn => btn.style.display = 'none');

      const canvas = await html2canvas(input, {
        scale: 2, // Increase scale for better resolution
        useCORS: true, // If images/resources are from a different origin
        logging: true,
      });

      // Revert hidden elements if any
      // buttons.forEach(btn => btn.style.display = '');

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4'); // 'p' for portrait, 'mm' for millimeters, 'a4' size
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // Add student name and assignment title as header if provided
      if (studentName && assignmentTitle) {
        pdf.setFontSize(10);
        pdf.text(`Student: ${studentName}`, 10, 10);
        pdf.text(`Assignment: ${assignmentTitle}`, 10, 15);
        position = 20; // Adjust starting position for image if header is added
      }

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight - position;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(filename);

      toast({
        title: "PDF Generated Successfully",
        description: `"${filename}" has been downloaded.`,
        variant: "success",
      });

    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "PDF Generation Failed",
        description: "There was an error generating the PDF report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  }, [toast]); // Depend on toast to avoid stale closure issues

  return { isGeneratingPdf, handleDownloadPdf };
};