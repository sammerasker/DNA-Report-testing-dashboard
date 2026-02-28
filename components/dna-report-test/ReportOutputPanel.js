/**
 * Report Output Panel Component
 * 
 * Displays the final assembled report with markdown rendering,
 * quality metrics, and comparison mode support.
 * 
 * @component
 */

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import styles from './ReportOutputPanel.module.css';

/**
 * @typedef {Object} QualityMetrics
 * @property {Object} scoreReferences - Score reference metrics
 * @property {Object} userTypeMentions - User type mention metrics
 * @property {Object} sectionCompleteness - Section completeness metrics
 * @property {Object} wordCount - Word count metrics
 * @property {Object} domainReferences - Domain reference metrics
 * @property {Object} centralTensionReferences - Central tension metrics
 * @property {number} overallScore - Overall quality score (0-100)
 */

/**
 * @typedef {Object} ReportOutputPanelProps
 * @property {string} report - Assembled report text
 * @property {QualityMetrics} metrics - Quality metrics for the report
 * @property {boolean} isComparison - Whether comparison mode is active
 * @property {string} [monolithicReport] - Monolithic architecture report (comparison mode)
 * @property {QualityMetrics} [monolithicMetrics] - Monolithic metrics (comparison mode)
 * @property {Object} [profileData] - User profile data for PDF header
 */

/**
 * ReportOutputPanel component for displaying generated reports
 * @param {ReportOutputPanelProps} props
 */
export default function ReportOutputPanel({
  report = '',
  metrics = null,
  isComparison = false,
  monolithicReport = '',
  monolithicMetrics = null,
  profileData = null
}) {
  const [copySuccess, setCopySuccess] = useState({
    chunked: false,
    monolithic: false,
    single: false
  });
  // Copy to clipboard
  const handleCopy = async (text, type = 'single') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(prev => ({ ...prev, [type]: true }));
      setTimeout(() => {
        setCopySuccess(prev => ({ ...prev, [type]: false }));
      }, 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      alert('Failed to copy to clipboard');
    }
  };

  // Download as text file (PDF generation would require additional library)
  const handleDownload = (text, filename) => {
    const blob = new Blob([text], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Download as PDF
  const handleDownloadPDF = async (text, filename, profileData = null) => {
    try {
      // Create a temporary container for rendering
      const container = document.createElement('div');
      container.style.cssText = `
        position: absolute;
        left: -9999px;
        width: 800px;
        padding: 40px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        line-height: 1.6;
        color: #000;
        background: #fff;
      `;
      
      // Add profile header if provided
      if (profileData) {
        const header = document.createElement('div');
        header.style.cssText = 'margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #333;';
        header.innerHTML = `
          <h1 style="margin: 0 0 10px 0; font-size: 24px;">Entrepreneurial DNA Report</h1>
          <p style="margin: 5px 0;"><strong>Name:</strong> ${profileData.name || 'N/A'}</p>
          <p style="margin: 5px 0;"><strong>Email:</strong> ${profileData.email || 'N/A'}</p>
          <p style="margin: 5px 0;"><strong>User Type:</strong> ${profileData.userType || 'N/A'}</p>
        `;
        container.appendChild(header);
      }
      
      // Convert markdown to HTML
      const contentDiv = document.createElement('div');
      contentDiv.innerHTML = convertMarkdownToHTML(text);
      container.appendChild(contentDiv);
      
      document.body.appendChild(container);
      
      // Use html2canvas and jsPDF to generate PDF
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');
      
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false
      });
      
      document.body.removeChild(container);
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(filename);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate PDF. Downloading as markdown instead.');
      handleDownload(text, filename.replace('.pdf', '.md'));
    }
  };

  // Simple markdown to HTML converter
  const convertMarkdownToHTML = (markdown) => {
    let html = markdown;
    
    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3 style="margin: 20px 0 10px 0; font-size: 18px;">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 style="margin: 25px 0 15px 0; font-size: 20px;">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 style="margin: 30px 0 20px 0; font-size: 24px;">$1</h1>');
    
    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Italic
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Lists
    html = html.replace(/^\* (.*$)/gim, '<li style="margin: 5px 0;">$1</li>');
    html = html.replace(/^- (.*$)/gim, '<li style="margin: 5px 0;">$1</li>');
    
    // Wrap lists
    html = html.replace(/(<li.*<\/li>)/s, '<ul style="margin: 10px 0; padding-left: 20px;">$1</ul>');
    
    // Paragraphs
    html = html.split('\n\n').map(para => {
      if (!para.startsWith('<') && para.trim()) {
        return `<p style="margin: 10px 0;">${para}</p>`;
      }
      return para;
    }).join('\n');
    
    return html;
  };

  // Render quality metrics
  const renderMetrics = (metricsData, title = 'Quality Metrics') => {
    if (!metricsData) return null;

    const {
      scoreReferences,
      userTypeMentions,
      sectionCompleteness,
      wordCount,
      domainReferences,
      centralTensionReferences,
      overallScore
    } = metricsData;

    return (
      <div className={styles.metricsSection}>
        <h3 className={styles.metricsTitle}>{title}</h3>
        
        <div className={styles.overallScore}>
          <span className={styles.scoreLabel}>Overall Score:</span>
          <span className={`${styles.scoreValue} ${getScoreClass(overallScore)}`}>
            {overallScore}/100
          </span>
        </div>

        <div className={styles.metricsList}>
          {scoreReferences && (
            <MetricItem
              label="Score References"
              value={`${scoreReferences.count}/${scoreReferences.target}`}
              pass={scoreReferences.pass}
            />
          )}
          
          {userTypeMentions && (
            <MetricItem
              label="User Type Mentions"
              value={`${userTypeMentions.count} (min: ${userTypeMentions.minimum})`}
              pass={userTypeMentions.pass}
            />
          )}
          
          {sectionCompleteness && (
            <MetricItem
              label="Section Completeness"
              value={`${sectionCompleteness.count}/${sectionCompleteness.target}`}
              pass={sectionCompleteness.pass}
            />
          )}
          
          {wordCount && (
            <MetricItem
              label="Word Count"
              value={`${wordCount.count} (target: ${wordCount.range[0]}-${wordCount.range[1]})`}
              pass={wordCount.pass}
            />
          )}
          
          {domainReferences && (
            <MetricItem
              label="Domain References"
              value={`${domainReferences.count}/${domainReferences.target}`}
              pass={domainReferences.pass}
            />
          )}
          
          {centralTensionReferences && (
            <MetricItem
              label="Central Tension"
              value={`${centralTensionReferences.count} (min: ${centralTensionReferences.minimum})`}
              pass={centralTensionReferences.pass}
            />
          )}
        </div>
      </div>
    );
  };

  const getScoreClass = (score) => {
    if (score >= 80) return styles.scoreHigh;
    if (score >= 60) return styles.scoreMedium;
    return styles.scoreLow;
  };

  if (!report && !monolithicReport) {
    return (
      <div className={styles.reportOutputPanel}>
        <div className={styles.header}>
          <h2 className={styles.title}>Report Output</h2>
        </div>
        <div className={styles.emptyMessage}>
          <p>No report generated yet.</p>
          <p>Click &quot;Generate Report&quot; in the Control Panel to create a report.</p>
        </div>
      </div>
    );
  }

  if (isComparison && monolithicReport) {
    // Comparison mode: side-by-side view
    return (
      <div className={styles.reportOutputPanel}>
        <div className={styles.header}>
          <h2 className={styles.title}>Report Comparison</h2>
        </div>

        <div className={styles.comparisonContainer}>
          {/* Chunked Architecture */}
          <div className={styles.comparisonColumn}>
            <div className={styles.columnHeader}>
              <h3>Chunked Architecture</h3>
              <div className={styles.columnActions}>
                <button 
                  onClick={() => handleCopy(report, 'chunked')}
                  className={styles.actionButton}
                >
                  {copySuccess.chunked ? '✓ Copied!' : '📋 Copy'}
                </button>
                <button 
                  onClick={() => handleDownload(report, 'report-chunked.md')}
                  className={styles.actionButton}
                >
                  💾 Download MD
                </button>
                <button 
                  onClick={() => handleDownloadPDF(report, 'report-chunked.pdf', profileData)}
                  className={styles.actionButton}
                >
                  📄 Download PDF
                </button>
              </div>
            </div>
            
            {renderMetrics(metrics, 'Chunked Metrics')}
            
            <div className={styles.reportContent}>
              <ReactMarkdown>{report}</ReactMarkdown>
            </div>
          </div>

          {/* Monolithic Architecture */}
          <div className={styles.comparisonColumn}>
            <div className={styles.columnHeader}>
              <h3>Monolithic Architecture</h3>
              <div className={styles.columnActions}>
                <button 
                  onClick={() => handleCopy(monolithicReport, 'monolithic')}
                  className={styles.actionButton}
                >
                  {copySuccess.monolithic ? '✓ Copied!' : '📋 Copy'}
                </button>
                <button 
                  onClick={() => handleDownload(monolithicReport, 'report-monolithic.md')}
                  className={styles.actionButton}
                >
                  💾 Download MD
                </button>
                <button 
                  onClick={() => handleDownloadPDF(monolithicReport, 'report-monolithic.pdf', profileData)}
                  className={styles.actionButton}
                >
                  📄 Download PDF
                </button>
              </div>
            </div>
            
            {renderMetrics(monolithicMetrics, 'Monolithic Metrics')}
            
            <div className={styles.reportContent}>
              <ReactMarkdown>{monolithicReport}</ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Single report view
  return (
    <div className={styles.reportOutputPanel}>
      <div className={styles.header}>
        <h2 className={styles.title}>Report Output</h2>
        <div className={styles.headerActions}>
          <button 
            onClick={() => handleCopy(report, 'single')}
            className={styles.actionButton}
          >
            {copySuccess.single ? '✓ Copied!' : '📋 Copy'}
          </button>
          <button 
            onClick={() => handleDownload(report, 'dna-report.md')}
            className={styles.actionButton}
          >
            💾 Download MD
          </button>
          <button 
            onClick={() => handleDownloadPDF(report, 'dna-report.pdf', profileData)}
            className={styles.actionButton}
          >
            📄 Download PDF
          </button>
        </div>
      </div>

      {renderMetrics(metrics)}

      <div className={styles.reportContent}>
        <ReactMarkdown>{report}</ReactMarkdown>
      </div>
    </div>
  );
}

/**
 * MetricItem component for displaying individual metrics
 */
function MetricItem({ label, value, pass }) {
  return (
    <div className={styles.metricItem}>
      <span className={styles.metricLabel}>{label}:</span>
      <span className={styles.metricValue}>{value}</span>
      <span className={`${styles.metricStatus} ${pass ? styles.pass : styles.fail}`}>
        {pass ? '✓' : '✗'}
      </span>
    </div>
  );
}
