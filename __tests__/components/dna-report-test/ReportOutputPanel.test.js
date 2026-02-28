/**
 * Unit tests for ReportOutputPanel component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ReportOutputPanel from '../../../components/dna-report-test/ReportOutputPanel';

describe('ReportOutputPanel', () => {
  const mockReport = '# Test Report\n\nThis is a test report.';
  
  const mockMetrics = {
    scoreReferences: { count: 10, target: 10, pass: true },
    userTypeMentions: { count: 8, minimum: 6, pass: true },
    sectionCompleteness: { count: 10, target: 10, pass: true },
    wordCount: { count: 3000, range: [2500, 4000], pass: true },
    domainReferences: { count: 4, target: 4, pass: true },
    centralTensionReferences: { count: 3, minimum: 2, pass: true },
    overallScore: 95
  };

  test('renders report output panel with title', () => {
    render(<ReportOutputPanel report={mockReport} metrics={mockMetrics} />);
    expect(screen.getByText('Report Output')).toBeInTheDocument();
  });

  test('displays empty message when no report', () => {
    render(<ReportOutputPanel report="" metrics={null} />);
    expect(screen.getByText(/No report generated yet/i)).toBeInTheDocument();
  });

  test('renders action buttons when report is available', () => {
    render(<ReportOutputPanel report={mockReport} metrics={mockMetrics} />);
    const copyButtons = screen.getAllByText(/Copy/i);
    const downloadButtons = screen.getAllByText(/Download/i);
    expect(copyButtons.length).toBeGreaterThan(0);
    expect(downloadButtons.length).toBeGreaterThan(0);
  });

  test('displays quality metrics section', () => {
    render(<ReportOutputPanel report={mockReport} metrics={mockMetrics} />);
    expect(screen.getByText('Quality Metrics')).toBeInTheDocument();
    expect(screen.getByText('Overall Score:')).toBeInTheDocument();
    expect(screen.getByText('95/100')).toBeInTheDocument();
  });

  test('displays all metric items', () => {
    render(<ReportOutputPanel report={mockReport} metrics={mockMetrics} />);
    expect(screen.getByText(/Score References/i)).toBeInTheDocument();
    expect(screen.getByText(/User Type Mentions/i)).toBeInTheDocument();
    expect(screen.getByText(/Section Completeness/i)).toBeInTheDocument();
    expect(screen.getByText(/Word Count/i)).toBeInTheDocument();
    expect(screen.getByText(/Domain References/i)).toBeInTheDocument();
    expect(screen.getByText(/Central Tension/i)).toBeInTheDocument();
  });

  test('displays pass/fail indicators for metrics', () => {
    render(<ReportOutputPanel report={mockReport} metrics={mockMetrics} />);
    const passIndicators = screen.getAllByText('✓');
    expect(passIndicators.length).toBe(6); // All 6 metrics pass
  });

  test('renders report content with markdown', () => {
    render(<ReportOutputPanel report={mockReport} metrics={mockMetrics} />);
    expect(screen.getByText('Test Report')).toBeInTheDocument();
    expect(screen.getByText('This is a test report.')).toBeInTheDocument();
  });

  test('renders comparison mode with two columns', () => {
    const monolithicReport = '# Monolithic Report\n\nMonolithic content.';
    const monolithicMetrics = { ...mockMetrics, overallScore: 85 };
    
    render(
      <ReportOutputPanel
        report={mockReport}
        metrics={mockMetrics}
        isComparison={true}
        monolithicReport={monolithicReport}
        monolithicMetrics={monolithicMetrics}
      />
    );
    
    expect(screen.getByText('Report Comparison')).toBeInTheDocument();
    expect(screen.getByText('Chunked Architecture')).toBeInTheDocument();
    expect(screen.getByText('Monolithic Architecture')).toBeInTheDocument();
  });

  test('displays metrics for both architectures in comparison mode', () => {
    const monolithicReport = '# Monolithic Report';
    const monolithicMetrics = { ...mockMetrics, overallScore: 85 };
    
    render(
      <ReportOutputPanel
        report={mockReport}
        metrics={mockMetrics}
        isComparison={true}
        monolithicReport={monolithicReport}
        monolithicMetrics={monolithicMetrics}
      />
    );
    
    expect(screen.getByText('Chunked Metrics')).toBeInTheDocument();
    expect(screen.getByText('Monolithic Metrics')).toBeInTheDocument();
    expect(screen.getByText('95/100')).toBeInTheDocument();
    expect(screen.getByText('85/100')).toBeInTheDocument();
  });
});
