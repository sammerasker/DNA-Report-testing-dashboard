/**
 * Unit tests for EnrichedDataPanel component
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import EnrichedDataPanel from '../../../components/dna-report-test/EnrichedDataPanel';

describe('EnrichedDataPanel', () => {
  const mockEnrichedContext = `SCORE INTERPRETATIONS:
- Strategic Thinking: 85 - High
- Innovation: 90 - High

DOMAIN MAPPINGS:
Cognitive & Vision: Strategic Thinking (85), Innovation (90)

TRAIT INSIGHTS:
- Strategic Thinking: Strong strategic thinking capability
- Innovation: Highly innovative mindset

ROLE MATCH RATIONALE:
- CEO: Strong strategic and innovative capabilities

CENTRAL TENSION:
Vision-execution gap analysis`;

  test('renders enriched data panel with title', () => {
    render(<EnrichedDataPanel enrichedContext={mockEnrichedContext} isEnrichmentEnabled={true} />);
    expect(screen.getByText('Enriched Context')).toBeInTheDocument();
  });

  test('displays disabled message when enrichment is disabled', () => {
    render(<EnrichedDataPanel enrichedContext="" isEnrichmentEnabled={false} />);
    expect(screen.getByText(/Data enrichment is currently disabled/i)).toBeInTheDocument();
  });

  test('displays empty message when no enriched context', () => {
    render(<EnrichedDataPanel enrichedContext="" isEnrichmentEnabled={true} />);
    expect(screen.getByText(/No enriched context available/i)).toBeInTheDocument();
  });

  test('renders toolbar buttons when context is available', () => {
    render(<EnrichedDataPanel enrichedContext={mockEnrichedContext} isEnrichmentEnabled={true} />);
    // Button shows "Collapse All" when sections are present (default expanded state)
    expect(screen.getByText(/Collapse All/i)).toBeInTheDocument();
    expect(screen.getByText(/Copy/i)).toBeInTheDocument();
  });

  test('displays stats (lines, chars, tokens)', () => {
    render(<EnrichedDataPanel enrichedContext={mockEnrichedContext} isEnrichmentEnabled={true} />);
    expect(screen.getByText(/lines/i)).toBeInTheDocument();
    expect(screen.getByText(/chars/i)).toBeInTheDocument();
    expect(screen.getByText(/tokens/i)).toBeInTheDocument();
  });

  test('renders collapsible sections', () => {
    render(<EnrichedDataPanel enrichedContext={mockEnrichedContext} isEnrichmentEnabled={true} />);
    expect(screen.getByText('SCORE INTERPRETATIONS')).toBeInTheDocument();
    expect(screen.getByText('DOMAIN MAPPINGS')).toBeInTheDocument();
    expect(screen.getByText('TRAIT INSIGHTS')).toBeInTheDocument();
    expect(screen.getByText('ROLE MATCH RATIONALE')).toBeInTheDocument();
    expect(screen.getByText('CENTRAL TENSION')).toBeInTheDocument();
  });

  test('toggles section expansion when clicked', () => {
    render(<EnrichedDataPanel enrichedContext={mockEnrichedContext} isEnrichmentEnabled={true} />);
    
    const sectionButton = screen.getByText('SCORE INTERPRETATIONS');
    
    // Initially expanded, content should be visible
    expect(screen.getByText(/Strategic Thinking: 85 - High/i)).toBeInTheDocument();
    
    // Click to collapse
    fireEvent.click(sectionButton);
    
    // Content should be hidden (not in document)
    expect(screen.queryByText(/Strategic Thinking: 85 - High/i)).not.toBeInTheDocument();
  });

  test('expand all button toggles all sections', () => {
    render(<EnrichedDataPanel enrichedContext={mockEnrichedContext} isEnrichmentEnabled={true} />);
    
    const expandAllButton = screen.getByText(/Collapse All/i);
    
    // Click to collapse all
    fireEvent.click(expandAllButton);
    
    // Button text should change
    expect(screen.getByText(/Expand All/i)).toBeInTheDocument();
  });
});
