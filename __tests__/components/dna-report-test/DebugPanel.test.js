/**
 * Unit tests for DebugPanel component
 */

import { jest } from '@jest/globals';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import DebugPanel from '../../../components/dna-report-test/DebugPanel';

describe('DebugPanel', () => {
  const mockChunks = [
    {
      chunkId: 1,
      content: 'Chunk 1 content',
      promptTokens: 500,
      responseTokens: 300,
      totalTokens: 800,
      latency: 1500,
      status: 'success',
      prompt: 'Test prompt for chunk 1',
      response: 'Test response for chunk 1'
    },
    {
      chunkId: 2,
      content: '',
      promptTokens: 0,
      responseTokens: 0,
      totalTokens: 0,
      latency: 0,
      status: 'error',
      error: {
        message: 'API request failed',
        code: '500',
        retryable: true
      }
    },
    {
      chunkId: 3,
      content: '',
      promptTokens: 0,
      responseTokens: 0,
      totalTokens: 0,
      latency: 0,
      status: 'pending'
    }
  ];

  const mockOnRetryChunk = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders debug panel with title', () => {
    render(<DebugPanel chunks={mockChunks} onRetryChunk={mockOnRetryChunk} />);
    expect(screen.getByText('Debug Panel')).toBeInTheDocument();
  });

  test('displays empty message when no chunks', () => {
    render(<DebugPanel chunks={[]} onRetryChunk={mockOnRetryChunk} />);
    expect(screen.getByText(/No chunk execution data available/i)).toBeInTheDocument();
  });

  test('renders expand all button', () => {
    render(<DebugPanel chunks={mockChunks} onRetryChunk={mockOnRetryChunk} />);
    // Button shows "Collapse All" when chunks are present (default expanded state)
    expect(screen.getByText(/Collapse All/i)).toBeInTheDocument();
  });

  test('renders all chunk sections', () => {
    render(<DebugPanel chunks={mockChunks} onRetryChunk={mockOnRetryChunk} />);
    expect(screen.getByText('Chunk 1')).toBeInTheDocument();
    expect(screen.getByText('Chunk 2')).toBeInTheDocument();
    expect(screen.getByText('Chunk 3')).toBeInTheDocument();
  });

  test('displays status badges for each chunk', () => {
    render(<DebugPanel chunks={mockChunks} onRetryChunk={mockOnRetryChunk} />);
    expect(screen.getByText('success')).toBeInTheDocument();
    expect(screen.getByText('error')).toBeInTheDocument();
    expect(screen.getByText('pending')).toBeInTheDocument();
  });

  test('displays token and latency stats for successful chunks', () => {
    render(<DebugPanel chunks={mockChunks} onRetryChunk={mockOnRetryChunk} />);
    expect(screen.getByText('800 tokens')).toBeInTheDocument();
    expect(screen.getByText('1.50s')).toBeInTheDocument();
  });

  test('expands chunk details when header is clicked', () => {
    render(<DebugPanel chunks={mockChunks} onRetryChunk={mockOnRetryChunk} />);
    
    const chunkHeader = screen.getByText('Chunk 1');
    fireEvent.click(chunkHeader);
    
    // Check if details are visible
    expect(screen.getByText('Token Usage')).toBeInTheDocument();
    expect(screen.getByText('Prompt Sent to API')).toBeInTheDocument();
    expect(screen.getByText('Response from API')).toBeInTheDocument();
  });

  test('displays token breakdown when chunk is expanded', () => {
    render(<DebugPanel chunks={mockChunks} onRetryChunk={mockOnRetryChunk} />);
    
    const chunkHeader = screen.getByText('Chunk 1');
    fireEvent.click(chunkHeader);
    
    expect(screen.getByText('Prompt:')).toBeInTheDocument();
    expect(screen.getByText('Response:')).toBeInTheDocument();
    expect(screen.getByText('Total:')).toBeInTheDocument();
    expect(screen.getByText('Latency:')).toBeInTheDocument();
  });

  test('displays error message for failed chunks', () => {
    render(<DebugPanel chunks={mockChunks} onRetryChunk={mockOnRetryChunk} />);
    
    const chunkHeader = screen.getByText('Chunk 2');
    fireEvent.click(chunkHeader);
    
    expect(screen.getByText(/API request failed/i)).toBeInTheDocument();
    expect(screen.getByText(/Code:/i)).toBeInTheDocument();
    expect(screen.getByText('500')).toBeInTheDocument();
  });

  test('displays retry button for failed chunks', () => {
    render(<DebugPanel chunks={mockChunks} onRetryChunk={mockOnRetryChunk} />);
    
    const chunkHeader = screen.getByText('Chunk 2');
    fireEvent.click(chunkHeader);
    
    const retryButton = screen.getByText(/Retry Chunk/i);
    expect(retryButton).toBeInTheDocument();
  });

  test('calls onRetryChunk when retry button is clicked', () => {
    render(<DebugPanel chunks={mockChunks} onRetryChunk={mockOnRetryChunk} />);
    
    const chunkHeader = screen.getByText('Chunk 2');
    fireEvent.click(chunkHeader);
    
    const retryButton = screen.getByText(/Retry Chunk/i);
    fireEvent.click(retryButton);
    
    expect(mockOnRetryChunk).toHaveBeenCalledWith(2);
  });

  test('displays pending message for pending chunks', () => {
    render(<DebugPanel chunks={mockChunks} onRetryChunk={mockOnRetryChunk} />);
    
    const chunkHeader = screen.getByText('Chunk 3');
    fireEvent.click(chunkHeader);
    
    expect(screen.getByText(/Chunk is being generated/i)).toBeInTheDocument();
  });

  test('displays prompt and response content', () => {
    render(<DebugPanel chunks={mockChunks} onRetryChunk={mockOnRetryChunk} />);
    
    const chunkHeader = screen.getByText('Chunk 1');
    fireEvent.click(chunkHeader);
    
    expect(screen.getByText('Test prompt for chunk 1')).toBeInTheDocument();
    expect(screen.getByText('Test response for chunk 1')).toBeInTheDocument();
  });
});
