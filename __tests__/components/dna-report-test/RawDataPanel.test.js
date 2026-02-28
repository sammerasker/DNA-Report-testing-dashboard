/**
 * Unit tests for RawDataPanel component
 */

import { jest } from '@jest/globals';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import RawDataPanel from '../../../components/dna-report-test/RawDataPanel';

describe('RawDataPanel', () => {
  const mockData = {
    profile: {
      name: 'Test User',
      email: 'test@example.com',
      userType: 'Visionary Entrepreneur'
    },
    normalizedScores: {
      strategicThinking: 85,
      innovation: 90
    }
  };

  const mockOnDataChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders raw data panel with title', () => {
    render(<RawDataPanel data={mockData} onDataChange={mockOnDataChange} />);
    expect(screen.getByText('Raw Assessment Data')).toBeInTheDocument();
  });

  test('displays valid JSON badge when data is valid', () => {
    render(<RawDataPanel data={mockData} onDataChange={mockOnDataChange} />);
    expect(screen.getByText('✓ Valid JSON')).toBeInTheDocument();
  });

  test('displays JSON data in textarea', () => {
    render(<RawDataPanel data={mockData} onDataChange={mockOnDataChange} />);
    const textarea = screen.getByRole('textbox');
    expect(textarea.value).toContain('Test User');
    expect(textarea.value).toContain('Visionary Entrepreneur');
  });

  test('calls onDataChange when valid JSON is entered', async () => {
    render(<RawDataPanel data={mockData} onDataChange={mockOnDataChange} />);
    const textarea = screen.getByRole('textbox');
    
    const newData = { test: 'value' };
    fireEvent.change(textarea, { target: { value: JSON.stringify(newData) } });
    
    await waitFor(() => {
      expect(mockOnDataChange).toHaveBeenCalledWith(newData);
    });
  });

  test('shows validation error for invalid JSON', async () => {
    render(<RawDataPanel data={mockData} onDataChange={mockOnDataChange} />);
    const textarea = screen.getByRole('textbox');
    
    fireEvent.change(textarea, { target: { value: '{ invalid json' } });
    
    await waitFor(() => {
      expect(screen.getByText('✗ Invalid JSON')).toBeInTheDocument();
      expect(screen.getByText(/Validation Error:/i)).toBeInTheDocument();
    });
  });

  test('renders toolbar buttons', () => {
    render(<RawDataPanel data={mockData} onDataChange={mockOnDataChange} />);
    expect(screen.getByText(/Load from File/i)).toBeInTheDocument();
    expect(screen.getByText(/Format/i)).toBeInTheDocument();
    expect(screen.getByText(/Copy/i)).toBeInTheDocument();
  });

  test('displays character and line count', () => {
    render(<RawDataPanel data={mockData} onDataChange={mockOnDataChange} />);
    expect(screen.getByText(/lines/i)).toBeInTheDocument();
    expect(screen.getByText(/chars/i)).toBeInTheDocument();
  });

  test('format button is disabled when JSON is invalid', async () => {
    render(<RawDataPanel data={mockData} onDataChange={mockOnDataChange} />);
    const textarea = screen.getByRole('textbox');
    
    fireEvent.change(textarea, { target: { value: '{ invalid' } });
    
    await waitFor(() => {
      const formatButton = screen.getByText(/Format/i);
      expect(formatButton).toBeDisabled();
    });
  });
});
