import PDFDocument from 'pdfkit';
import { createWriteStream } from 'fs';
import { join } from 'path';
import { ScreeningReport } from '../types/index.js';

/**
 * PDF Export Service
 * Generates professional PDF reports
 */
export class PDFExportService {
  /**
   * Generate PDF report
   */
  async generateReport(report: ScreeningReport, outputPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: 50, bottom: 50, left: 50, right: 50 }
        });

        const stream = createWriteStream(outputPath);
        doc.pipe(stream);

        // Header
        doc.fontSize(24)
           .fillColor('#6366f1')
           .text('NeuroScan AI', { align: 'center' });
        
        doc.fontSize(18)
           .fillColor('#1e293b')
           .text('Mental Health Screening Report', { align: 'center' });
        
        doc.moveDown();
        doc.fontSize(10)
           .fillColor('#64748b')
           .text(`Generated: ${new Date(report.timestamp).toLocaleString()}`, { align: 'center' });
        
        doc.moveDown(2);

        // Crisis Warning
        if (report.crisisDetected) {
          doc.rect(50, doc.y, 495, 80)
             .fillAndStroke('#fee2e2', '#ef4444');
          
          doc.fillColor('#991b1b')
             .fontSize(14)
             .text('⚠️ IMMEDIATE ATTENTION REQUIRED', 60, doc.y + 10);
          
          doc.fontSize(10)
             .text('Based on your responses, we strongly recommend speaking with a mental health professional immediately.', 60, doc.y + 5, { width: 475 });
          
          doc.moveDown(3);
        }

        // Depression Score
        doc.fontSize(16)
           .fillColor('#1e293b')
           .text('Depression Assessment (PHQ-9)');
        
        doc.moveDown(0.5);
        
        doc.fontSize(12)
           .fillColor('#64748b')
           .text(`Score: ${report.phq9Score} / 27`);
        
        doc.fontSize(12)
           .fillColor(this.getClassificationColor(report.phq9Classification))
           .text(`Classification: ${report.phq9Classification.toUpperCase()}`);
        
        // Progress bar
        this.drawProgressBar(doc, report.phq9Score, 27);
        
        doc.moveDown(2);

        // Anxiety Score
        doc.fontSize(16)
           .fillColor('#1e293b')
           .text('Anxiety Assessment (GAD-7)');
        
        doc.moveDown(0.5);
        
        doc.fontSize(12)
           .fillColor('#64748b')
           .text(`Score: ${report.gad7Score} / 21`);
        
        doc.fontSize(12)
           .fillColor(this.getClassificationColor(report.gad7Classification))
           .text(`Classification: ${report.gad7Classification.toUpperCase()}`);
        
        // Progress bar
        this.drawProgressBar(doc, report.gad7Score, 21);
        
        doc.moveDown(2);

        // Key Observations
        if (report.keyObservations.length > 0) {
          doc.fontSize(16)
             .fillColor('#1e293b')
             .text('Key Observations');
          
          doc.moveDown(0.5);
          
          report.keyObservations.forEach((obs, index) => {
            doc.fontSize(11)
               .fillColor('#64748b')
               .text(`• ${obs}`, { indent: 20 });
          });
          
          doc.moveDown(2);
        }

        // Recommendations
        if (report.suggestions.length > 0) {
          doc.fontSize(16)
             .fillColor('#1e293b')
             .text('Recommendations');
          
          doc.moveDown(0.5);
          
          report.suggestions.forEach((suggestion, index) => {
            doc.fontSize(11)
               .fillColor('#64748b')
               .text(`• ${suggestion}`, { indent: 20 });
          });
          
          doc.moveDown(2);
        }

        // Disclaimer
        doc.addPage();
        doc.fontSize(14)
           .fillColor('#1e293b')
           .text('Important Disclaimer');
        
        doc.moveDown(0.5);
        
        doc.fontSize(10)
           .fillColor('#64748b')
           .text('This screening tool is designed to provide early detection of potential mental health concerns. It is NOT a clinical diagnosis and should not replace professional medical advice, diagnosis, or treatment. If you\'re experiencing mental health difficulties, please consult with a qualified healthcare provider or mental health professional.', { align: 'justify' });
        
        doc.moveDown();
        
        doc.fontSize(10)
           .fillColor('#64748b')
           .text('The PHQ-9 and GAD-7 are validated screening instruments, but their results should be interpreted by a qualified professional in the context of a comprehensive clinical assessment.', { align: 'justify' });

        // Footer
        doc.fontSize(8)
           .fillColor('#94a3b8')
           .text('NeuroScan AI - Mental Health Screening Platform', 50, 750, { align: 'center' });
        
        doc.text('This report is confidential and intended for the individual named above.', { align: 'center' });

        doc.end();

        stream.on('finish', () => {
          resolve(outputPath);
        });

        stream.on('error', (error) => {
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Draw progress bar
   */
  private drawProgressBar(doc: PDFKit.PDFDocument, score: number, maxScore: number) {
    const barWidth = 400;
    const barHeight = 20;
    const x = 100;
    const y = doc.y + 10;
    const percentage = (score / maxScore) * 100;
    const fillWidth = (barWidth * percentage) / 100;

    // Background
    doc.rect(x, y, barWidth, barHeight)
       .fillAndStroke('#e2e8f0', '#cbd5e1');

    // Fill
    const fillColor = percentage < 33 ? '#10b981' : 
                     percentage < 66 ? '#f59e0b' : '#ef4444';
    
    doc.rect(x, y, fillWidth, barHeight)
       .fill(fillColor);

    doc.moveDown(2);
  }

  /**
   * Get color for classification
   */
  private getClassificationColor(classification: string): string {
    switch (classification.toLowerCase()) {
      case 'minimal':
        return '#10b981';
      case 'mild':
        return '#f59e0b';
      case 'moderate':
        return '#f97316';
      case 'moderately_severe':
      case 'severe':
        return '#ef4444';
      default:
        return '#64748b';
    }
  }

  /**
   * Generate filename for report
   */
  generateFilename(sessionId: string): string {
    const timestamp = new Date().toISOString().split('T')[0];
    return `neuroscan-report-${sessionId.slice(0, 8)}-${timestamp}.pdf`;
  }
}

export const pdfExportService = new PDFExportService();
