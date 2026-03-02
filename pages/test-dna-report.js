/**
 * Test page for DNA Report Chunked Pipeline
 * Accessible at /test-dna-report
 * 
 * This page provides a comprehensive test harness for the DNA Report generation system,
 * allowing developers to visualize the complete pipeline transformation process.
 */

import { useState, useEffect } from 'react';
import Head from 'next/head';
import ControlPanel from '../components/dna-report-test/ControlPanel';
import RawDataPanel from '../components/dna-report-test/RawDataPanel';
import EnrichedDataPanel from '../components/dna-report-test/EnrichedDataPanel';
import MonolithicDataPanel from '../components/dna-report-test/MonolithicDataPanel';
import ReportOutputPanel from '../components/dna-report-test/ReportOutputPanel';
import DebugPanel from '../components/dna-report-test/DebugPanel';
import { enrichAssessmentData } from '../lib/dna-report-chunked/enrichment';
import { createChunkExecutor } from '../lib/dna-report-chunked/chunk-executor';
import ReportAssembler from '../lib/dna-report-chunked/report-assembler';
import QualityMetrics from '../lib/dna-report-chunked/quality-metrics';
import { createOpenRouterProvider, createHuggingFaceProvider, createMoonshotProvider } from '../lib/dna-report-chunked/api-provider';
import { createMonolithicGenerator, generateMonolithicPromptData } from '../lib/dna-report-chunked/monolithic-generator';

export default function TestDNAReport() {
  // ===== State Management =====
  
  // Assessment data state
  const [assessmentData, setAssessmentData] = useState(null);
  const [enrichedContext, setEnrichedContext] = useState('');
  const [monolithicPrompt, setMonolithicPrompt] = useState('');
  
  // API configuration state
  const [provider, setProvider] = useState('moonshot'); // Changed default from 'openrouter' to 'moonshot'
  const [model, setModel] = useState('moonshot-v1-128k'); // Changed default to 128k model
  const [systemPrompt, setSystemPrompt] = useState('You are an expert entrepreneurial psychologist and career advisor with deep expertise in startup ecosystems, leadership development, and organizational psychology.');
  
  // UI state
  const [enrichmentEnabled, setEnrichmentEnabled] = useState(true);
  const [monolithicEnrichmentEnabled, setMonolithicEnrichmentEnabled] = useState(false);
  const [architecture, setArchitecture] = useState('monolithic'); // 'chunked', 'monolithic', 'comparison'
  const [batchDelay, setBatchDelay] = useState(5); // Default 5 seconds
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Report generation state
  const [chunkResults, setChunkResults] = useState([]);
  const [assembledReport, setAssembledReport] = useState('');
  const [qualityMetrics, setQualityMetrics] = useState(null);
  
  // Comparison mode state
  const [monolithicReport, setMonolithicReport] = useState('');
  const [monolithicMetrics, setMonolithicMetrics] = useState(null);
  
  // Performance tracking state
  const [tokenCount, setTokenCount] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [requestsUsed, setRequestsUsed] = useState(0);
  
  // ===== Load Sample Data on Mount (Task 9.14) =====
  useEffect(() => {
    const loadSampleData = async () => {
      try {
        const response = await fetch('/sampledata.json');
        if (response.ok) {
          const data = await response.json();
          setAssessmentData(data);
        } else {
          console.warn('Sample data not found at /sampledata.json');
        }
      } catch (error) {
        console.error('Failed to load sample data:', error);
      }
    };
    
    loadSampleData();
  }, []);
  
  // ===== Generate Monolithic Prompt when data or settings change =====
  useEffect(() => {
    if (assessmentData && (architecture === 'monolithic' || architecture === 'comparison')) {
      // Generate enriched context if needed for monolithic
      const enrichedCtx = monolithicEnrichmentEnabled ? enrichAssessmentData(assessmentData) : null;
      
      // Generate monolithic prompt
      const prompt = generateMonolithicPromptData(assessmentData, monolithicEnrichmentEnabled, enrichedCtx);
      setMonolithicPrompt(prompt);
    }
  }, [assessmentData, architecture, monolithicEnrichmentEnabled]);
  
  // ===== Timer Effect =====
  useEffect(() => {
    let interval;
    
    if (status === 'generating' && startTime) {
      interval = setInterval(() => {
        setElapsedTime(Date.now() - startTime);
      }, 100); // Update every 100ms
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status, startTime]);
  
  // ===== Event Handlers =====
  
  /**
   * Handle provider change
   */
  const handleProviderChange = (newProvider) => {
    setProvider(newProvider);
    
    // Set default model for provider
    if (newProvider === 'openrouter') {
      setModel('openrouter/free');
    } else if (newProvider === 'huggingface') {
      setModel('openai/gpt-oss-20b');
    } else if (newProvider === 'moonshot') {
      setModel('moonshot-v1-128k'); // Changed default to 128k model
    }
  };
  
  /**
   * Handle model change
   */
  const handleModelChange = (newModel) => {
    setModel(newModel);
  };
  
  /**
   * Handle system prompt change
   */
  const handleSystemPromptChange = (newPrompt) => {
    setSystemPrompt(newPrompt);
  };
  
  /**
   * Handle enrichment toggle
   */
  const handleEnrichmentToggle = (enabled) => {
    setEnrichmentEnabled(enabled);
  };
  
  /**
   * Handle monolithic enrichment toggle
   */
  const handleMonolithicEnrichmentToggle = (enabled) => {
    setMonolithicEnrichmentEnabled(enabled);
  };
  
  /**
   * Handle monolithic prompt change
   */
  const handleMonolithicPromptChange = (newPrompt) => {
    setMonolithicPrompt(newPrompt);
  };
  
  /**
   * Handle architecture mode change
   */
  const handleArchitectureChange = (mode) => {
    setArchitecture(mode);
  };
  
  /**
   * Handle batch delay change
   */
  const handleBatchDelayChange = (delay) => {
    setBatchDelay(delay);
  };
  
  /**
   * Handle assessment data change
   */
  const handleDataChange = (newData) => {
    setAssessmentData(newData);
  };
  
  /**
   * Handle generate button click
   * Executes the full DNA report generation pipeline with progressive display
   * Supports comparison mode to run both chunked and monolithic architectures
   */
  const handleGenerate = async () => {
    if (!assessmentData) {
      setErrorMessage('No assessment data available');
      setStatus('error');
      return;
    }
    
    try {
      setStatus('generating');
      setErrorMessage('');
      const genStartTime = Date.now();
      setStartTime(genStartTime);
      setTokenCount(0);
      setElapsedTime(0);
      setRequestsUsed(0);
      setChunkResults([]);
      setAssembledReport('');
      setQualityMetrics(null);
      setMonolithicReport('');
      setMonolithicMetrics(null);
      
      // Step 1: Enrich assessment data if enrichment is enabled
      let contextForGeneration = '';
      if (enrichmentEnabled) {
        console.log('[TestPage] Enriching assessment data...');
        contextForGeneration = enrichAssessmentData(assessmentData);
        setEnrichedContext(contextForGeneration);
        console.log('[TestPage] Enrichment complete');
      } else {
        console.log('[TestPage] Skipping enrichment (disabled)');
        setEnrichedContext('');
      }
      
      // Step 2: Create API provider based on selected provider and fallback providers
      console.log(`[TestPage] Creating API provider: ${provider}`);
      let apiProvider;
      let fallbackProviders = [];
      
      // Create primary provider
      if (provider === 'openrouter') {
        apiProvider = createOpenRouterProvider();
        // Fallback order: HuggingFace -> Moonshot
        fallbackProviders = [createHuggingFaceProvider(), createMoonshotProvider()];
      } else if (provider === 'huggingface') {
        apiProvider = createHuggingFaceProvider();
        // Fallback order: Moonshot -> OpenRouter
        fallbackProviders = [createMoonshotProvider(), createOpenRouterProvider()];
      } else if (provider === 'moonshot') {
        apiProvider = createMoonshotProvider();
        // Fallback order: OpenRouter -> HuggingFace
        fallbackProviders = [createOpenRouterProvider(), createHuggingFaceProvider()];
      } else {
        apiProvider = createOpenRouterProvider(); // fallback
        fallbackProviders = [createHuggingFaceProvider(), createMoonshotProvider()];
      }
      
      console.log(`[TestPage] Fallback providers configured: ${fallbackProviders.map(p => p.provider).join(' -> ')}`);
      
      // Step 3: Execute based on architecture mode
      if (architecture === 'comparison') {
        console.log('[TestPage] Comparison mode - executing both architectures');
        
        // Execute both chunked and monolithic in parallel
        const [chunkedResult, monolithicResult] = await Promise.all([
          // Chunked architecture
          (async () => {
            const executor = createChunkExecutor(apiProvider);
            const chunks = await executor.executeChunks(
              enrichmentEnabled ? contextForGeneration : null,
              {
                maxTokens: 1500,
                temperature: 0.7,
                useEnrichment: enrichmentEnabled,
                rawData: enrichmentEnabled ? null : assessmentData,
                batchDelay: batchDelay,
                providerFallback: fallbackProviders,
                systemPrompt: systemPrompt
              }
            );
            return chunks;
          })(),
          
          // Monolithic architecture
          (async () => {
            const generator = createMonolithicGenerator(apiProvider);
            const result = await generator.generateReport(assessmentData, {
              maxTokens: 4000,
              temperature: 0.7,
              systemPrompt: systemPrompt,
              useEnrichment: monolithicEnrichmentEnabled,
              enrichedContext: monolithicEnrichmentEnabled ? contextForGeneration : null
            });
            return result;
          })()
        ]);
        
        // Process chunked results
        setChunkResults(chunkedResult);
        console.log(`[TestPage] Chunked: ${chunkedResult.length} chunks executed`);
        
        const chunkedTokens = chunkedResult.reduce((sum, chunk) => sum + (chunk.totalTokens || 0), 0);
        const chunkedRequests = chunkedResult.length; // Each chunk = 1 request
        
        // Assemble chunked report
        const assembler = new ReportAssembler();
        const chunksForAssembly = chunkedResult.map(chunk => ({
          chunkId: chunk.chunkId,
          content: chunk.content,
          success: chunk.status === 'success',
          error: chunk.error?.message
        }));
        
        const userProfile = {
          name: assessmentData.profile?.name || 'N/A',
          email: assessmentData.profile?.email || 'N/A',
          userType: assessmentData.profile?.userType || 'N/A'
        };
        
        const chunkedReport = assembler.assembleReport(chunksForAssembly, userProfile);
        setAssembledReport(chunkedReport);
        
        // Calculate chunked metrics (only if report is not empty)
        let chunkedMetrics = null;
        if (chunkedReport && chunkedReport.trim().length > 0) {
          const chunkedMetricsEngine = new QualityMetrics();
          chunkedMetrics = chunkedMetricsEngine.calculateMetrics(chunkedReport, assessmentData);
          setQualityMetrics(chunkedMetrics);
        } else {
          console.warn('[TestPage] Chunked report is empty, skipping metrics calculation');
          setQualityMetrics(null);
        }
        
        // Process monolithic results
        console.log(`[TestPage] Monolithic: ${monolithicResult.status}`);
        setMonolithicReport(monolithicResult.content);
        
        const monolithicRequests = 1; // Monolithic = 1 request
        
        // Calculate monolithic metrics (only if report is not empty)
        let monolithicMetrics = null;
        if (monolithicResult.content && monolithicResult.content.trim().length > 0) {
          const monolithicMetricsEngine = new QualityMetrics();
          monolithicMetrics = monolithicMetricsEngine.calculateMetrics(monolithicResult.content, assessmentData);
          setMonolithicMetrics(monolithicMetrics);
        } else {
          console.warn('[TestPage] Monolithic report is empty, skipping metrics calculation');
          setMonolithicMetrics(null);
        }
        
        // Set total token count (sum of both)
        setTokenCount(chunkedTokens + (monolithicResult.totalTokens || 0));
        
        // Set total requests used (sum of both)
        setRequestsUsed(chunkedRequests + monolithicRequests);
        
        // Log comparison results
        const chunkedScore = chunkedMetrics ? chunkedMetrics.overallScore : 'N/A';
        const monolithicScore = monolithicMetrics ? monolithicMetrics.overallScore : 'N/A';
        console.log(`[TestPage] Comparison complete - Chunked: ${chunkedScore}/100, Monolithic: ${monolithicScore}/100`);
        
      } else if (architecture === 'chunked') {
        // Chunked architecture only
        console.log('[TestPage] Executing chunked architecture only');
        const executor = createChunkExecutor(apiProvider);
        
        const chunks = await executor.executeChunks(
          enrichmentEnabled ? contextForGeneration : null,
          {
            maxTokens: 1500,
            temperature: 0.7,
            useEnrichment: enrichmentEnabled,
            rawData: enrichmentEnabled ? null : assessmentData,
            batchDelay: batchDelay,
            providerFallback: fallbackProviders,
            systemPrompt: systemPrompt
          }
        );
        
        setChunkResults(chunks);
        console.log(`[TestPage] Chunks executed: ${chunks.length} results`);
        
        // Calculate total tokens
        const totalTokens = chunks.reduce((sum, chunk) => sum + (chunk.totalTokens || 0), 0);
        setTokenCount(totalTokens);
        
        // Set requests used (each chunk = 1 request)
        setRequestsUsed(chunks.length);
        
        // Check if any chunks failed
        const failedChunks = chunks.filter(c => c.status === 'error');
        if (failedChunks.length > 0) {
          const failedIds = failedChunks.map(c => c.chunkId).join(', ');
          console.warn(`[TestPage] ${failedChunks.length} chunks failed: ${failedIds}`);
        }
        
        // Assemble report from successful chunks
        console.log('[TestPage] Assembling report...');
        const assembler = new ReportAssembler();
        
        const chunksForAssembly = chunks.map(chunk => ({
          chunkId: chunk.chunkId,
          content: chunk.content,
          success: chunk.status === 'success',
          error: chunk.error?.message
        }));
        
        const userProfile = {
          name: assessmentData.profile?.name || 'N/A',
          email: assessmentData.profile?.email || 'N/A',
          userType: assessmentData.profile?.userType || 'N/A'
        };
        
        const report = assembler.assembleReport(chunksForAssembly, userProfile);
        setAssembledReport(report);
        console.log('[TestPage] Report assembled');
        
        // Calculate quality metrics (only if report is not empty)
        if (report && report.trim().length > 0) {
          console.log('[TestPage] Calculating quality metrics...');
          const metricsEngine = new QualityMetrics();
          const metrics = metricsEngine.calculateMetrics(report, assessmentData);
          setQualityMetrics(metrics);
          console.log(`[TestPage] Quality metrics calculated: ${metrics.overallScore}/100`);
        } else {
          console.warn('[TestPage] Report is empty, skipping metrics calculation');
          setQualityMetrics(null);
        }
      } else if (architecture === 'monolithic') {
        // Monolithic architecture only
        console.log('[TestPage] Executing monolithic architecture only');
        const generator = createMonolithicGenerator(apiProvider);
        
        const result = await generator.generateReport(assessmentData, {
          maxTokens: 4000,
          temperature: 0.7,
          systemPrompt: systemPrompt,
          useEnrichment: monolithicEnrichmentEnabled,
          enrichedContext: monolithicEnrichmentEnabled ? contextForGeneration : null
        });
        
        console.log(`[TestPage] Monolithic generation complete: ${result.status}`);
        
        // Check if generation failed
        if (result.status === 'error') {
          throw new Error(result.error?.message || 'Monolithic generation failed');
        }
        
        setMonolithicReport(result.content);
        setAssembledReport(result.content); // Also set as main report for display
        
        // Set token count
        setTokenCount(result.totalTokens || 0);
        
        // Set requests used (monolithic = 1 request)
        setRequestsUsed(1);
        
        // Calculate quality metrics (only if report is not empty)
        if (result.content && result.content.trim().length > 0) {
          console.log('[TestPage] Calculating quality metrics...');
          const metricsEngine = new QualityMetrics();
          const metrics = metricsEngine.calculateMetrics(result.content, assessmentData);
          setQualityMetrics(metrics);
          setMonolithicMetrics(metrics); // Also set as monolithic metrics
          console.log(`[TestPage] Quality metrics calculated: ${metrics.overallScore}/100`);
        } else {
          console.warn('[TestPage] Monolithic report is empty, skipping metrics calculation');
          setQualityMetrics(null);
          setMonolithicMetrics(null);
        }
      }
      
      // Update final state
      setStatus('complete');
      setElapsedTime(Date.now() - genStartTime);
      console.log(`[TestPage] Generation complete in ${Date.now() - genStartTime}ms`);
      
    } catch (error) {
      setStatus('error');
      setErrorMessage(error.message || 'Generation failed');
      console.error('[TestPage] Generation error:', error);
    }
  };
  
  /**
   * Handle chunk retry
   * Re-executes a single failed chunk while preserving successful results
   */
  const handleRetryChunk = async (chunkId) => {
    console.log(`[TestPage] Retrying chunk ${chunkId}...`);
    
    if (!assessmentData) {
      console.error('[TestPage] Cannot retry: no assessment data');
      return;
    }
    
    try {
      // Create API provider
      const apiProvider = provider === 'openrouter'
        ? createOpenRouterProvider()
        : createHuggingFaceProvider();
      
      // Create executor
      const executor = createChunkExecutor(apiProvider);
      
      // Get enriched context if needed
      let contextForRetry = '';
      if (enrichmentEnabled) {
        contextForRetry = enrichedContext || enrichAssessmentData(assessmentData);
      }
      
      // Execute single chunk
      console.log(`[TestPage] Executing single chunk ${chunkId}...`);
      const retryResult = await executor.executeChunk(
        chunkId,
        enrichmentEnabled ? contextForRetry : null,
        {
          maxTokens: 1500,
          temperature: 0.7,
          useEnrichment: enrichmentEnabled,
          rawData: enrichmentEnabled ? null : assessmentData,
          systemPrompt: systemPrompt
        }
      );
      
      // Update chunk results - replace the failed chunk with retry result
      const updatedChunks = chunkResults.map(chunk => 
        chunk.chunkId === chunkId ? retryResult : chunk
      );
      
      setChunkResults(updatedChunks);
      console.log(`[TestPage] Chunk ${chunkId} retry complete: ${retryResult.status}`);
      
      // Recalculate total tokens
      const totalTokens = updatedChunks.reduce((sum, chunk) => sum + (chunk.totalTokens || 0), 0);
      setTokenCount(totalTokens);
      
      // Reassemble report with updated chunks
      const assembler = new ReportAssembler();
      const chunksForAssembly = updatedChunks.map(chunk => ({
        chunkId: chunk.chunkId,
        content: chunk.content,
        success: chunk.status === 'success',
        error: chunk.error?.message
      }));
      
      const userProfile = {
        name: assessmentData.profile?.name || 'N/A',
        email: assessmentData.profile?.email || 'N/A',
        userType: assessmentData.profile?.userType || 'N/A'
      };
      
      const report = assembler.assembleReport(chunksForAssembly, userProfile);
      setAssembledReport(report);
      
      // Recalculate quality metrics (only if report is not empty)
      if (report && report.trim().length > 0) {
        const metricsEngine = new QualityMetrics();
        const metrics = metricsEngine.calculateMetrics(report, assessmentData);
        setQualityMetrics(metrics);
      } else {
        console.warn('[TestPage] Report is empty after retry, skipping metrics calculation');
        setQualityMetrics(null);
      }
      
      console.log(`[TestPage] Report reassembled after retry`);
      
    } catch (error) {
      console.error(`[TestPage] Chunk ${chunkId} retry failed:`, error);
      setErrorMessage(`Retry failed: ${error.message}`);
    }
  };
  
  return (
    <>
      <Head>
        <title>DNA Report Chunked Pipeline - Test Page</title>
        <meta name="description" content="Test page for DNA Report Chunked Pipeline" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main style={styles.main}>
        <h1 style={styles.title}>DNA Report Chunked Pipeline</h1>
        <p style={styles.subtitle}>Test Harness for Report Generation System</p>

        {/* Responsive Grid Layout */}
        <div style={styles.gridContainer}>
          {/* Control Panel - Full Width Top */}
          <div style={styles.controlPanelSection}>
            <ControlPanel
              onGenerate={handleGenerate}
              onProviderChange={handleProviderChange}
              onModelChange={handleModelChange}
              onSystemPromptChange={handleSystemPromptChange}
              onEnrichmentToggle={handleEnrichmentToggle}
              onMonolithicEnrichmentToggle={handleMonolithicEnrichmentToggle}
              onArchitectureChange={handleArchitectureChange}
              onBatchDelayChange={handleBatchDelayChange}
              provider={provider}
              model={model}
              systemPrompt={systemPrompt}
              enrichmentEnabled={enrichmentEnabled}
              monolithicEnrichmentEnabled={monolithicEnrichmentEnabled}
              architecture={architecture}
              batchDelay={batchDelay}
              status={status}
              tokenCount={tokenCount}
              elapsedTime={elapsedTime}
              errorMessage={errorMessage}
              requestsUsed={requestsUsed}
            />
          </div>

          {/* Two Column Layout for Data Panels */}
          <div style={styles.twoColumnSection}>
            <div style={styles.column}>
              <RawDataPanel
                data={assessmentData}
                onDataChange={handleDataChange}
              />
            </div>
            
            <div style={styles.column}>
              <EnrichedDataPanel
                enrichedContext={enrichedContext}
                isEnrichmentEnabled={enrichmentEnabled}
              />
            </div>
          </div>

          {/* Monolithic Data Panel - Full Width - Only show for monolithic/comparison modes */}
          {(architecture === 'monolithic' || architecture === 'comparison') && (
            <div style={styles.fullWidthSection}>
              <MonolithicDataPanel
                monolithicPrompt={monolithicPrompt}
                onPromptChange={handleMonolithicPromptChange}
                isMonolithicMode={architecture === 'monolithic' || architecture === 'comparison'}
              />
            </div>
          )}

          {/* Report Output - Full Width */}
          <div style={styles.fullWidthSection}>
            <ReportOutputPanel
              report={assembledReport}
              metrics={qualityMetrics}
              isComparison={architecture === 'comparison'}
              monolithicReport={monolithicReport}
              monolithicMetrics={monolithicMetrics}
              profileData={assessmentData?.profile}
            />
          </div>

          {/* Debug Panel - Full Width Bottom - Only show for chunked/comparison modes */}
          {(architecture === 'chunked' || architecture === 'comparison') && (
            <div style={styles.fullWidthSection}>
              <DebugPanel
                chunks={chunkResults}
                onRetryChunk={handleRetryChunk}
              />
            </div>
          )}
        </div>
      </main>
    </>
  );
}

// ===== Styles =====
const styles = {
  main: {
    padding: '2rem',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    maxWidth: '1600px',
    margin: '0 auto',
    backgroundColor: '#f5f5f5',
    minHeight: '100vh'
  },
  title: {
    fontSize: '2.5rem',
    marginBottom: '0.5rem',
    color: '#333',
    fontWeight: '600'
  },
  subtitle: {
    fontSize: '1.2rem',
    color: '#666',
    marginBottom: '2rem'
  },
  gridContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem'
  },
  controlPanelSection: {
    width: '100%'
  },
  twoColumnSection: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
    gap: '1.5rem',
    width: '100%'
  },
  column: {
    minWidth: 0 // Prevent grid blowout
  },
  fullWidthSection: {
    width: '100%'
  }
};
