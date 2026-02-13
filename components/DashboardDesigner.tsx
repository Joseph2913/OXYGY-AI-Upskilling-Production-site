import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft, Monitor, Sparkles, FileText, Loader2, Check, RotateCcw,
  Edit2, Copy, ChevronDown, BarChart3, TrendingUp, Users, DollarSign,
} from 'lucide-react';
import { useDashboardDesignApi, type DashboardImageResult, type PRDResult } from '../hooks/useDashboardDesignApi';
import { ArtifactClosing } from './ArtifactClosing';
import { cn } from '../utils/cn';

// Level 4 colors
const ACCENT_COLOR = '#F5B8A0'; // Soft Peach
const DARK_ACCENT_COLOR = '#D47B5A'; // Dark Peach

interface MetricData {
  name: string;
  value: number;
  change: number;
}

// Generate a simple SVG dashboard visualization
function generateDashboardSVG(metrics: MetricData[], title: string = 'Dashboard', subtitle: string = 'Overview & Analytics'): string {
  const colors = ['#38B2AC', '#D47B5A', '#5B6DC2', '#C4A934', '#2BA89C', '#D4A017', '#F5B8A0'];
  
  const displayMetrics = metrics.slice(0, 6);
  const svgMetrics = displayMetrics.length > 0 ? displayMetrics : [
    { name: 'Revenue', value: 12500, change: 12.5 },
    { name: 'Users', value: 8450, change: 8.2 },
    { name: 'Growth', value: 3200, change: -2.1 },
    { name: 'Engagement', value: 9200, change: 15.3 },
  ];
  
  // Scale SVG to fit viewport better
  const svgWidth = 1200;
  const svgHeight = 800;
  const viewBoxWidth = svgWidth;
  const viewBoxHeight = svgHeight;
  
  return `<svg width="100%" height="100%" viewBox="0 0 ${viewBoxWidth} ${viewBoxHeight}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#F7FAFC;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#FFFFFF;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="1200" height="800" fill="#FFFFFF"/>
  
  <!-- Header -->
  <rect width="1200" height="80" fill="url(#headerGrad)"/>
  <rect width="1200" height="2" y="80" fill="#E2E8F0"/>
  <text x="40" y="50" font-family="DM Sans, sans-serif" font-size="28" font-weight="800" fill="#1A202C" letter-spacing="-0.5px">${title}</text>
  <text x="40" y="75" font-family="DM Sans, sans-serif" font-size="15" fill="#718096" letter-spacing="0.2px">${subtitle}</text>
  
  <!-- Sidebar -->
  <rect x="0" y="82" width="200" height="718" fill="#F7FAFC"/>
  <rect x="200" width="2" height="800" fill="#E2E8F0"/>
  
  <!-- Navigation items -->
  <text x="30" y="130" font-family="DM Sans, sans-serif" font-size="14" font-weight="600" fill="#38B2AC">Dashboard</text>
  <text x="30" y="160" font-family="DM Sans, sans-serif" font-size="14" fill="#4A5568">Analytics</text>
  <text x="30" y="190" font-family="DM Sans, sans-serif" font-size="14" fill="#4A5568">Reports</text>
  <text x="30" y="220" font-family="DM Sans, sans-serif" font-size="14" fill="#4A5568">Settings</text>
  
  <!-- KPI Cards -->
  ${svgMetrics.map((metric, idx) => {
    const x = 240 + (idx % 4) * 230;
    const y = 120 + Math.floor(idx / 4) * 180;
    const color = colors[idx % colors.length];
    const value = metric.value;
    const change = metric.change;
    const changeColor = change >= 0 ? color : '#E53E3E';
    
    return `<g>
      <defs>
        <linearGradient id="cardGrad${idx}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#FFFFFF;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#F7FAFC;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect x="${x}" y="${y}" width="210" height="140" rx="16" fill="url(#cardGrad${idx})" stroke="#E2E8F0" stroke-width="1.5"/>
      <rect x="${x + 1}" y="${y + 1}" width="208" height="138" rx="15" fill="none" stroke="${color}20" stroke-width="1"/>
      <text x="${x + 20}" y="${y + 32}" font-family="DM Sans, sans-serif" font-size="11" font-weight="700" fill="#718096" letter-spacing="0.5px" opacity="0.8">${metric.name.toUpperCase()}</text>
      <text x="${x + 20}" y="${y + 68}" font-family="DM Sans, sans-serif" font-size="38" font-weight="800" fill="#1A202C" letter-spacing="-1.5px">${value.toLocaleString()}</text>
      <rect x="${x + 20}" y="${y + 85}" width="75" height="30" rx="7" fill="${changeColor}18"/>
      <text x="${x + 28}" y="${y + 105}" font-family="DM Sans, sans-serif" font-size="13" font-weight="700" fill="${changeColor}">${change > 0 ? '+' : ''}${change.toFixed(1)}%</text>
      <circle cx="${x + 185}" cy="${y + 20}" r="5" fill="${color}30"/>
      <circle cx="${x + 185}" cy="${y + 20}" r="3" fill="${color}"/>
    </g>`;
  }).join('')}
  
  <!-- Chart Area -->
  <rect x="240" y="420" width="720" height="320" rx="16" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.04));"/>
  <text x="260" y="452" font-family="DM Sans, sans-serif" font-size="20" font-weight="700" fill="#1A202C" letter-spacing="-0.3px">Performance Trends</text>
  
  <!-- Chart background grid -->
  <line x1="260" y1="500" x2="940" y2="500" stroke="#F7FAFC" stroke-width="2"/>
  <line x1="260" y1="550" x2="940" y2="550" stroke="#F7FAFC" stroke-width="2"/>
  <line x1="260" y1="600" x2="940" y2="600" stroke="#F7FAFC" stroke-width="2"/>
  <line x1="260" y1="650" x2="940" y2="650" stroke="#F7FAFC" stroke-width="2"/>
  
  <!-- Simple line chart representation with gradient fill -->
  <defs>
    <linearGradient id="chartGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#38B2AC;stop-opacity:0.3" />
      <stop offset="100%" style="stop-color:#38B2AC;stop-opacity:0" />
    </linearGradient>
  </defs>
  <polyline points="260,550 320,520 380,480 440,500 500,460 560,440 620,420 680,400 740,380 800,360 860,340 920,320 920,680 260,680"
    fill="url(#chartGrad)" stroke="none"/>
  <polyline points="260,550 320,520 380,480 440,500 500,460 560,440 620,420 680,400 740,380 800,360 860,340 920,320"
    fill="none" stroke="#38B2AC" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="260" cy="550" r="6" fill="#38B2AC" stroke="#FFFFFF" stroke-width="2"/>
  <circle cx="320" cy="520" r="6" fill="#38B2AC" stroke="#FFFFFF" stroke-width="2"/>
  <circle cx="380" cy="480" r="6" fill="#38B2AC" stroke="#FFFFFF" stroke-width="2"/>
  <circle cx="440" cy="500" r="6" fill="#38B2AC" stroke="#FFFFFF" stroke-width="2"/>
  <circle cx="500" cy="460" r="6" fill="#38B2AC" stroke="#FFFFFF" stroke-width="2"/>
  <circle cx="560" cy="440" r="6" fill="#38B2AC" stroke="#FFFFFF" stroke-width="2"/>
  <circle cx="620" cy="420" r="6" fill="#38B2AC" stroke="#FFFFFF" stroke-width="2"/>
  <circle cx="680" cy="400" r="6" fill="#38B2AC" stroke="#FFFFFF" stroke-width="2"/>
  <circle cx="740" cy="380" r="6" fill="#38B2AC" stroke="#FFFFFF" stroke-width="2"/>
  <circle cx="800" cy="360" r="6" fill="#38B2AC" stroke="#FFFFFF" stroke-width="2"/>
  <circle cx="860" cy="340" r="6" fill="#38B2AC" stroke="#FFFFFF" stroke-width="2"/>
  <circle cx="920" cy="320" r="6" fill="#38B2AC" stroke="#FFFFFF" stroke-width="2"/>
  
  <!-- X-axis labels -->
  <text x="260" y="750" font-family="DM Sans, sans-serif" font-size="11" fill="#A0AEC0">Jan</text>
  <text x="380" y="750" font-family="DM Sans, sans-serif" font-size="11" fill="#A0AEC0">Feb</text>
  <text x="500" y="750" font-family="DM Sans, sans-serif" font-size="11" fill="#A0AEC0">Mar</text>
  <text x="620" y="750" font-family="DM Sans, sans-serif" font-size="11" fill="#A0AEC0">Apr</text>
  <text x="740" y="750" font-family="DM Sans, sans-serif" font-size="11" fill="#A0AEC0">May</text>
  <text x="860" y="750" font-family="DM Sans, sans-serif" font-size="11" fill="#A0AEC0">Jun</text>
  
  <!-- Table -->
  <rect x="980" y="420" width="200" height="320" rx="16" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.04));"/>
  <text x="1000" y="452" font-family="DM Sans, sans-serif" font-size="20" font-weight="700" fill="#1A202C" letter-spacing="-0.3px">Recent Activity</text>
  ${[1, 2, 3, 4, 5].map((i, idx) => `<rect x="990" y="${470 + idx * 50}" width="180" height="40" rx="8" fill="${idx % 2 === 0 ? '#F7FAFC' : '#FFFFFF'}" stroke="${idx % 2 === 0 ? 'none' : '#F7FAFC'}" stroke-width="1"/>
    <text x="1000" y="${490 + idx * 50}" font-family="DM Sans, sans-serif" font-size="13" font-weight="600" fill="#1A202C">Item ${i}</text>
    <text x="1000" y="${505 + idx * 50}" font-family="DM Sans, sans-serif" font-size="11" fill="#718096">${['Updated', 'Created', 'Modified'][idx % 3]}</text>`).join('')}
</svg>`;
}

const EXAMPLE_NEEDS = [
  {
    user_needs: 'I need a dashboard for our HR team to track employee learning progress, completion rates, and identify skill gaps across different departments.',
    target_audience: 'HR and L&D teams',
    key_metrics: 'Completion rates, skill gaps, department comparisons',
    data_sources: 'LMS data, employee records, assessment scores',
  },
  {
    user_needs: 'Our sales team needs to see real-time pipeline health, conversion rates by stage, and forecast accuracy. They need to drill down by rep, region, and product.',
    target_audience: 'Sales managers and reps',
    key_metrics: 'Pipeline value, conversion rates, forecast accuracy',
    data_sources: 'CRM data, sales activity logs, historical deals',
  },
  {
    user_needs: 'I want a customer success dashboard that shows NPS trends, support ticket volume by category, feature adoption rates, and churn risk indicators.',
    target_audience: 'Customer success managers',
    key_metrics: 'NPS, ticket volume, feature adoption, churn risk',
    data_sources: 'Support tickets, product analytics, survey responses',
  },
];

export const DashboardDesigner: React.FC = () => {
  // Input state
  const [userNeeds, setUserNeeds] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [keyMetrics, setKeyMetrics] = useState('');
  const [dataSources, setDataSources] = useState('');
  const [inspirationUrl, setInspirationUrl] = useState('');

  // Results state
  const [dashboardImage, setDashboardImage] = useState<DashboardImageResult | null>(null);
  const [dashboardSvg, setDashboardSvg] = useState<string>('');
  const [imagePrompt, setImagePrompt] = useState('');
  const [prdResult, setPrdResult] = useState<PRDResult | null>(null);
  const [showPRD, setShowPRD] = useState(false);
  const [showPrdDropdown, setShowPrdDropdown] = useState(false);
  const [isPrdLoading, setIsPrdLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // UI state
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState('');
  
  // Editable dashboard state
  const [editableMetrics, setEditableMetrics] = useState<Array<{name: string; value: number; change: number}>>([]);
  const [isEditingDashboard, setIsEditingDashboard] = useState(false);
  const [dashboardTitle, setDashboardTitle] = useState('Dashboard');
  const [dashboardSubtitle, setDashboardSubtitle] = useState('Overview & Analytics');

  // Refs
  const inputSectionRef = useRef<HTMLDivElement>(null);
  const imageSectionRef = useRef<HTMLDivElement>(null);
  const prdSectionRef = useRef<HTMLDivElement>(null);

  // API
  const { generateDashboardImage, generatePRD, isLoading, error, clearError } = useDashboardDesignApi();

  // ─── Handlers ───
  const handleExampleClick = (example: typeof EXAMPLE_NEEDS[0]) => {
    setUserNeeds(example.user_needs);
    setTargetAudience(example.target_audience);
    setKeyMetrics(example.key_metrics);
    setDataSources(example.data_sources);
    // Flash effect
    if (inputSectionRef.current) {
      inputSectionRef.current.style.backgroundColor = '#FFF5F0';
      setTimeout(() => {
        if (inputSectionRef.current) inputSectionRef.current.style.backgroundColor = '';
      }, 300);
    }
  };

  // Generate dashboard using Gemini API
  const generateDashboardWithGemini = async (): Promise<DashboardImageResult | null> => {
    const metrics = editableMetrics.length > 0 
      ? editableMetrics 
      : (keyMetrics.split(',').map(m => m.trim()).filter(Boolean) || ['Revenue', 'Users', 'Growth', 'Engagement']).map((name, idx) => ({
          name,
          value: Math.floor(Math.random() * 9000 + 1000),
          change: parseFloat((Math.random() * 20 - 5).toFixed(1)),
        }));
    
    // Initialize editable metrics if empty
    if (editableMetrics.length === 0) {
      setEditableMetrics(metrics);
    }
    
    // Try Gemini API - if it fails, return null to trigger fallback
    try {
      const result = await generateDashboardImage({
        user_needs: userNeeds.trim(),
        target_audience: targetAudience.trim() || undefined,
        key_metrics: keyMetrics.trim() || undefined,
        data_sources: dataSources.trim() || undefined,
        dashboard_title: dashboardTitle,
        dashboard_subtitle: dashboardSubtitle,
        editable_metrics: editableMetrics.length > 0 ? editableMetrics : undefined,
        inspiration_url: inspirationUrl.trim() || undefined,
      });
      
      // Log result for debugging
      if (result) {
        console.log('Gemini API success:', result.html_content ? 'HTML generated' : 'Image URL generated');
      } else {
        console.log('Gemini API returned null, using fallback');
      }
      
      return result;
    } catch (err) {
      console.error('Error calling Gemini API:', err);
      return null;
    }
  };

  // Generate a simple dashboard SVG as fallback
  const generateSimpleDashboard = (): DashboardImageResult => {
    const metrics = editableMetrics.length > 0 
      ? editableMetrics 
      : (keyMetrics.split(',').map(m => m.trim()).filter(Boolean) || ['Revenue', 'Users', 'Growth', 'Engagement']).map((name, idx) => ({
          name,
          value: Math.floor(Math.random() * 9000 + 1000),
          change: parseFloat((Math.random() * 20 - 5).toFixed(1)),
        }));
    
    // Initialize editable metrics if empty
    if (editableMetrics.length === 0) {
      setEditableMetrics(metrics);
    }
    
    const prompt = `A professional business dashboard showing ${metrics.map(m => m.name).join(', ')} metrics for ${targetAudience || 'users'}. Includes charts, KPI cards, and data visualizations.`;
    
    const svgContent = generateDashboardSVG(metrics, dashboardTitle, dashboardSubtitle);
    
    // Store SVG content directly and create data URI
    setDashboardSvg(svgContent);
    const encodedSvg = encodeURIComponent(svgContent);
    const dataUri = `data:image/svg+xml;charset=utf-8,${encodedSvg}`;
    
    return {
      image_url: dataUri,
      image_prompt: prompt,
    };
  };
  
  const updateDashboard = async () => {
    if (dashboardImage) {
      // Try to regenerate with Gemini using updated values
      const geminiResult = await generateDashboardWithGemini();
      if (geminiResult && geminiResult.html_content) {
        setDashboardSvg(geminiResult.html_content);
        setDashboardImage(geminiResult);
        setImagePrompt(geminiResult.image_prompt);
        setEditedPrompt(geminiResult.image_prompt);
      } else {
        // Fallback to simple SVG
        const result = generateSimpleDashboard();
        setDashboardImage(result);
      }
    }
  };

  const handleGenerateImage = async () => {
    if (!userNeeds.trim()) return;
    clearError();
    setDashboardImage(null);
    setDashboardSvg('');
    setPrdResult(null);
    setShowPRD(false);
    setShowPrdDropdown(false);
    setIsEditingPrompt(false);
    setIsEditingDashboard(false);

    // Try Gemini API first, fallback to simple SVG
    console.log('Attempting to generate dashboard with Gemini API...');
    const geminiResult = await generateDashboardWithGemini();

    let finalPrompt = '';
    if (geminiResult && geminiResult.html_content) {
      console.log('✅ Using Gemini-generated HTML dashboard');
      setDashboardSvg(geminiResult.html_content);
      setDashboardImage(geminiResult);
      setImagePrompt(geminiResult.image_prompt);
      setEditedPrompt(geminiResult.image_prompt);
      finalPrompt = geminiResult.image_prompt;
    } else if (geminiResult && geminiResult.image_url && !geminiResult.use_fallback) {
      console.log('✅ Using Gemini-generated image URL');
      setDashboardImage(geminiResult);
      setImagePrompt(geminiResult.image_prompt);
      setEditedPrompt(geminiResult.image_prompt);
      finalPrompt = geminiResult.image_prompt;
    } else {
      if (geminiResult?.use_fallback) {
        console.log('⚠️ Gemini quota exceeded, using SVG fallback');
      } else {
        console.log('⚠️ Gemini API unavailable, using SVG fallback');
      }
      const result = generateSimpleDashboard();
      setDashboardImage(result);
      setImagePrompt(result.image_prompt);
      setEditedPrompt(result.image_prompt);
      finalPrompt = result.image_prompt;
    }

    setTimeout(() => {
      imageSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 500);

    // Auto-generate PRD in background
    setIsPrdLoading(true);
    setShowPRD(true);
    try {
      const prd = await generatePRD({
        user_needs: userNeeds.trim(),
        image_prompt: finalPrompt,
        target_audience: targetAudience.trim() || undefined,
        key_metrics: keyMetrics.trim() || undefined,
        data_sources: dataSources.trim() || undefined,
      });
      if (prd) {
        setPrdResult(prd);
      } else {
        // Fallback to simple PRD
        setPrdResult(generateSimplePRD());
      }
    } catch {
      setPrdResult(generateSimplePRD());
    } finally {
      setIsPrdLoading(false);
    }
  };

  const handleEditPrompt = () => {
    setIsEditingPrompt(true);
  };

  const handleSavePrompt = () => {
    if (!editedPrompt.trim()) return;
    setImagePrompt(editedPrompt);
    setIsEditingPrompt(false);
    
    // Regenerate simple dashboard with updated metrics from prompt
    const metrics = keyMetrics.split(',').map(m => m.trim()).filter(Boolean) || ['Revenue', 'Users', 'Growth', 'Engagement'];
    const result = generateSimpleDashboard();
    setDashboardImage(result);
    setImagePrompt(editedPrompt);
    setEditedPrompt(editedPrompt);
  };

  const handleCancelEdit = () => {
    setEditedPrompt(imagePrompt);
    setIsEditingPrompt(false);
  };

  const generateSimplePRD = (): PRDResult => {
    const metrics = editableMetrics.length > 0 
      ? editableMetrics.map(m => m.name).join(', ')
      : keyMetrics || 'key metrics';
    
    const metricsList = metrics.split(',').map(m => m.trim()).filter(Boolean);
    const primaryMetrics = metricsList.slice(0, 4).join(', ');
    
    return {
      prd_content: `Product Requirements Document for ${dashboardTitle || 'Dashboard'} - ${targetAudience || 'Business Users'}`,
      sections: {
        title_and_author: `Title: ${dashboardTitle || 'Business Dashboard'}\nAuthor: Product Team\nDate: ${new Date().toLocaleDateString()}\nVersion: 1.0`,
        purpose_and_scope: `Business Purpose: ${userNeeds || 'Provide real-time visibility into key business metrics and performance indicators.'}\n\nTechnical Scope: Build an interactive web-based dashboard that displays ${primaryMetrics} through visual components including KPI cards, charts, and data tables. The dashboard will integrate with ${dataSources || 'existing data sources'} and provide filtering, drill-down, and export capabilities.`,
        stakeholders: `Primary Stakeholders: ${targetAudience || 'Business managers, analysts, and decision-makers'}\nSecondary Stakeholders: IT/Data teams responsible for data integration, end users who will interact with the dashboard daily`,
        market_assessment: `Target Demographics: ${targetAudience || 'Mid-to-senior level business professionals'} who need quick access to performance data. Users range from technical to non-technical backgrounds, requiring an intuitive interface.`,
        product_overview: `The ${dashboardTitle || 'Dashboard'} provides a centralized view of ${primaryMetrics}. Key use cases include: (1) Real-time monitoring of business performance, (2) Identifying trends and anomalies through visualizations, (3) Supporting data-driven decision making, (4) Sharing insights across teams.`,
        functional_requirements: `1. Display ${primaryMetrics} in KPI cards with current values and percentage changes\n2. Show performance trends over time via line charts\n3. Present recent activity in tabular format\n4. Enable filtering by date range, category, or metric type\n5. Support drill-down from summary to detailed views\n6. Provide export functionality (CSV, PDF)\n7. Responsive design for desktop and tablet devices`,
        usability_requirements: `1. Intuitive navigation with clear sidebar menu\n2. Consistent visual design following brand guidelines\n3. Accessible color contrast (WCAG AA compliance)\n4. Mobile-responsive layout\n5. Loading states and error messages\n6. Tooltips and help text for complex metrics\n7. Keyboard navigation support`,
        technical_requirements: `Platform: Web-based application (React/Next.js recommended)\nSecurity: Authentication required, role-based access control, data encryption in transit\nNetwork: RESTful API integration, support for real-time data updates via WebSocket\nIntegration: Connect to ${dataSources || 'CRM, analytics platforms, databases'}\nClient: Modern browsers (Chrome, Firefox, Safari, Edge), responsive design for tablets`,
        environmental_requirements: `Development: Node.js 18+, modern build tools (Vite/Webpack)\nProduction: Cloud hosting (Vercel/AWS recommended), CDN for static assets\nData: Secure API endpoints, rate limiting, caching strategy\nBrowser: Support for ES2020+ features, Canvas API for charts`,
        support_requirements: `Documentation: User guide, API documentation, deployment guide\nMonitoring: Error tracking (Sentry), analytics (Google Analytics), performance monitoring\nMaintenance: Regular updates for security patches, data source changes\nTraining: Onboarding materials for end users, admin training for configuration`,
        interaction_requirements: `1. Dashboard integrates with ${dataSources || 'external data sources'} via REST APIs\n2. Real-time updates through WebSocket or polling (configurable)\n3. Export functionality connects to file generation services\n4. Authentication integrates with SSO/identity provider\n5. Analytics events sent to tracking platform\n6. Error logging integrated with monitoring service`,
        assumptions: `1. Data sources are available via API or database connections\n2. Users have appropriate authentication credentials\n3. Network connectivity is stable for real-time updates\n4. Data formats are consistent and well-structured\n5. Browser support for modern web standards`,
        constraints: `1. Must work within existing security and compliance frameworks\n2. Limited to available data sources and API rate limits\n3. Performance targets: < 2s initial load, < 500ms for data updates\n4. Browser compatibility: Last 2 versions of major browsers\n5. Budget constraints may limit third-party service integrations`,
        dependencies: `1. Data source APIs must be available and documented\n2. Authentication/SSO system must be configured\n3. Design system and component library (if using)\n4. Third-party charting library (e.g., Recharts, Chart.js)\n5. Hosting infrastructure and domain configuration`,
        workflow_timeline: `Phase 1 (Weeks 1-2): Design and prototyping - Dashboard layout, component design, user flows\nPhase 2 (Weeks 3-4): Development - Core dashboard components, API integration, data visualization\nPhase 3 (Week 5): Testing - User acceptance testing, performance testing, accessibility audit\nPhase 4 (Week 6): Deployment - Staging deployment, production rollout, user training\nMilestones: Design approval (Week 2), MVP completion (Week 4), Production launch (Week 6)`,
        evaluation_metrics: `Performance: Page load time < 2s, API response time < 500ms, 99% uptime\nUsability: User satisfaction score > 4/5, task completion rate > 90%, support tickets < 5/month\nAdoption: Daily active users, feature usage rates, export/download frequency\nBusiness: Time saved vs manual reporting, decision-making speed improvement, user engagement metrics`,
      },
    };
  };

  const handleStartOver = () => {
    setUserNeeds('');
    setTargetAudience('');
    setKeyMetrics('');
    setDataSources('');
    setInspirationUrl('');
    setDashboardImage(null);
    setDashboardSvg('');
    setImagePrompt('');
    setPrdResult(null);
    setShowPRD(false);
    setShowPrdDropdown(false);
    setIsEditingPrompt(false);
    setIsEditingDashboard(false);
    setEditedPrompt('');
    setEditableMetrics([]);
    setDashboardTitle('Dashboard');
    setDashboardSubtitle('Overview & Analytics');
    setCopied(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const showToastNotification = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToastNotification('Copied to clipboard');
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      showToastNotification('Copied to clipboard');
    }
  };

  const handleCopyPRD = () => {
    if (!prdResult) return;
    const sectionTitles: Record<string, string> = {
      title_and_author: 'Title & Author Information',
      purpose_and_scope: 'Purpose and Scope',
      stakeholders: 'Stakeholder Identification',
      market_assessment: 'Market Assessment and Target Demographics',
      product_overview: 'Product Overview and Use Cases',
      functional_requirements: 'Functional Requirements',
      usability_requirements: 'Usability Requirements',
      technical_requirements: 'Technical Requirements',
      environmental_requirements: 'Environmental Requirements',
      support_requirements: 'Support Requirements',
      interaction_requirements: 'Interaction Requirements',
      assumptions: 'Assumptions',
      constraints: 'Constraints',
      dependencies: 'Dependencies',
      workflow_timeline: 'High-Level Workflow Plans, Timelines and Milestones',
      evaluation_metrics: 'Evaluation Plan and Performance Metrics',
    };
    
    const fullPRD = Object.entries(prdResult.sections)
      .map(([key, value]) => `## ${sectionTitles[key] || key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')}\n\n${value}`)
      .join('\n\n');
    copyToClipboard(fullPRD);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="min-h-screen bg-white pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-6">

        {/* ─── BREADCRUMB ─── */}
        <a href="#home" className="inline-flex items-center gap-1.5 text-[14px] text-[#718096] hover:text-[#D47B5A] transition-colors mb-8">
          <ArrowLeft size={16} /> Back to Level 4
        </a>

        {/* ─── HERO: Title (centered, matching L2/L3 style) ─── */}
        <div className="mb-8 text-center">
          <h1 className="text-[36px] md:text-[48px] font-bold text-[#1A202C] leading-[1.15] mb-6">
            Dashboard Design
            <br />
            <span className="relative inline-block">
              Thinking
              <span className="absolute left-0 -bottom-1 w-full h-[4px] bg-[#D47B5A] opacity-80 rounded-full" />
            </span>
          </h1>

          {/* ─── FUN FACT CARD ─── */}
          <div className="mb-4">
            <div
              className="relative rounded-2xl px-8 md:px-12 py-8 text-center overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(245, 184, 160, 0.15) 0%, rgba(212, 123, 90, 0.08) 50%, rgba(245, 184, 160, 0.12) 100%)',
                border: '1.5px solid #F5B8A0',
              }}
            >
              <div className="absolute top-3 left-4 flex gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#D47B5A] opacity-40" />
                <span className="w-2 h-2 rounded-full bg-[#F5B8A0] opacity-60" />
                <span className="w-2 h-2 rounded-full bg-[#D47B5A] opacity-30" />
              </div>

              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#D47B5A] mb-2">
                Did you know?
              </p>
              <p className="text-[17px] md:text-[19px] text-[#2D3748] leading-[1.6] font-medium mb-2">
                Organizations that design dashboards around user decisions see <span className="text-[#D47B5A] font-bold">4x higher adoption rates</span> compared
                to those built around available data alone.
              </p>
              <p className="text-[15px] text-[#718096] leading-[1.6] max-w-3xl mx-auto">
                Effective dashboards don't start with data — they start with understanding what decisions users need to make and what insights will drive action.
              </p>
            </div>
          </div>
        </div>

        {/* ─── END-TO-END JOURNEY ─── */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              {
                num: 1,
                title: 'Define User Needs',
                icon: '🎯',
                desc: 'Start with who will use the dashboard and what decisions they need to make.',
              },
              {
                num: 2,
                title: 'Generate Dashboard',
                icon: '✨',
                desc: 'AI creates a sleek, modern dashboard mockup tailored to your requirements.',
              },
              {
                num: 3,
                title: 'Review & Refine',
                icon: '🔍',
                desc: 'Edit metrics, titles, and layout. Regenerate until the design feels right.',
              },
              {
                num: 4,
                title: 'Export PRD',
                icon: '📄',
                desc: 'Get a structured PRD you can hand to AI coding tools like Lovable or Bolt.',
              },
            ].map((step) => (
              <div key={step.num} className="bg-white border border-[#E2E8F0] rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-[14px] font-bold shrink-0"
                    style={{ backgroundColor: 'rgba(245, 184, 160, 0.3)', color: DARK_ACCENT_COLOR }}
                  >
                    {step.num}
                  </div>
                  <span className="text-[15px] font-bold text-[#1A202C]">{step.icon} {step.title}</span>
                </div>
                <p className="text-[13px] text-[#718096] leading-[1.5]">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ─── INPUT SECTION (peach-themed card) ─── */}
        <div
          className="rounded-2xl p-6 sm:p-8 mb-8"
          style={{
            background: 'linear-gradient(135deg, rgba(245, 184, 160, 0.12) 0%, rgba(251, 206, 177, 0.08) 50%, rgba(245, 184, 160, 0.10) 100%)',
            border: '1.5px solid #F5B8A0',
          }}
        >
          {/* Example pills */}
          <div className="mb-6">
            <p className="text-[13px] font-semibold text-[#A0AEC0] uppercase tracking-wider mb-3">
              Example Use Cases
            </p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_NEEDS.map((example, idx) => (
                <button
                  key={idx}
                  onClick={() => handleExampleClick(example)}
                  className="px-4 py-2 text-[13px] text-[#2D3748] rounded-full transition-all duration-150"
                  style={{
                    backgroundColor: 'rgba(245, 184, 160, 0.2)',
                    border: '1px solid #F5B8A0',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#D47B5A';
                    e.currentTarget.style.backgroundColor = 'rgba(245, 184, 160, 0.35)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#F5B8A0';
                    e.currentTarget.style.backgroundColor = 'rgba(245, 184, 160, 0.2)';
                  }}
                >
                  {example.user_needs.length > 60 ? example.user_needs.slice(0, 60) + '...' : example.user_needs}
                </button>
              ))}
            </div>
          </div>

          <div ref={inputSectionRef} className="space-y-6">
            <div>
              <label className="block text-[14px] font-semibold text-[#1A202C] mb-2">
                What does your dashboard need to accomplish? *
              </label>
              <textarea
                value={userNeeds}
                onChange={(e) => setUserNeeds(e.target.value)}
                placeholder="Describe the primary purpose of your dashboard. What decisions does it need to support? What insights should users gain?"
                className="w-full border-2 rounded-lg px-4 py-3 text-[15px] text-[#1A202C] placeholder:text-[#A0AEC0] focus:outline-none focus:ring-[3px] transition-colors resize-none bg-white"
                style={{ borderColor: '#F5B8A0' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#D47B5A'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#F5B8A0'; }}
                rows={4}
              />
            </div>

            <div>
              <label className="block text-[14px] font-semibold text-[#1A202C] mb-2">
                Target Audience (optional)
              </label>
              <input
                type="text"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="e.g., Sales managers, HR teams, Executives"
                className="w-full border-2 rounded-lg px-4 py-3 text-[15px] text-[#1A202C] placeholder:text-[#A0AEC0] focus:outline-none focus:ring-[3px] transition-colors bg-white"
                style={{ borderColor: '#F5B8A0' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#D47B5A'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#F5B8A0'; }}
              />
            </div>

            <div>
              <label className="block text-[14px] font-semibold text-[#1A202C] mb-2">
                Key Metrics to Display (optional)
              </label>
              <input
                type="text"
                value={keyMetrics}
                onChange={(e) => setKeyMetrics(e.target.value)}
                placeholder="e.g., Revenue, Conversion rates, User engagement"
                className="w-full border-2 rounded-lg px-4 py-3 text-[15px] text-[#1A202C] placeholder:text-[#A0AEC0] focus:outline-none focus:ring-[3px] transition-colors bg-white"
                style={{ borderColor: '#F5B8A0' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#D47B5A'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#F5B8A0'; }}
              />
            </div>

            <div>
              <label className="block text-[14px] font-semibold text-[#1A202C] mb-2">
                Data Sources (optional)
              </label>
              <input
                type="text"
                value={dataSources}
                onChange={(e) => setDataSources(e.target.value)}
                placeholder="e.g., CRM, Analytics platform, Database"
                className="w-full border-2 rounded-lg px-4 py-3 text-[15px] text-[#1A202C] placeholder:text-[#A0AEC0] focus:outline-none focus:ring-[3px] transition-colors bg-white"
                style={{ borderColor: '#F5B8A0' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#D47B5A'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#F5B8A0'; }}
              />
            </div>

            <div>
              <label className="block text-[14px] font-semibold text-[#1A202C] mb-2">
                Inspiration Link (optional)
              </label>
              <input
                type="url"
                value={inspirationUrl}
                onChange={(e) => setInspirationUrl(e.target.value)}
                placeholder="e.g., https://dribbble.com/shots/... or any website URL for design inspiration"
                className="w-full border-2 rounded-lg px-4 py-3 text-[15px] text-[#1A202C] placeholder:text-[#A0AEC0] focus:outline-none focus:ring-[3px] transition-colors bg-white"
                style={{ borderColor: '#F5B8A0' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#D47B5A'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#F5B8A0'; }}
              />
              <p className="text-[12px] text-[#A0AEC0] mt-1">Paste a link to a dashboard or website you like — the AI will use it as design inspiration.</p>
            </div>
          </div>

          <button
            onClick={handleGenerateImage}
            disabled={!userNeeds.trim() || isLoading}
            className="mt-6 w-full md:w-auto px-8 py-3 text-white font-semibold rounded-full transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{
              backgroundColor: DARK_ACCENT_COLOR,
            }}
            onMouseEnter={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.backgroundColor = '#C06A4A';
              }
            }}
            onMouseLeave={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.backgroundColor = DARK_ACCENT_COLOR;
              }
            }}
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Generating Dashboard...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Generate Dashboard Design
              </>
            )}
          </button>

          {error && (
            <div className="bg-[#FFF5F5] border border-[#FC8181] rounded-lg p-4 text-[14px] text-[#C53030] mt-4">
              {error}
            </div>
          )}
        </div>

        {/* Blank Canvas - shown before dashboard is generated */}
        {!dashboardImage && (
          <div ref={imageSectionRef} className="mb-16">
            <div className="flex items-center gap-2 mb-6">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: DARK_ACCENT_COLOR }}
              >
                2
              </div>
              <h2 className="text-[24px] font-bold text-[#1A202C]">Dashboard Preview</h2>
            </div>
            <div className="bg-[#FAFBFC] border-2 border-dashed border-[#E2E8F0] rounded-xl overflow-hidden" style={{ position: 'relative', paddingBottom: '66.67%' }}>
              <div className="text-center px-8" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                <Monitor size={56} className="mx-auto mb-4" style={{ color: '#CBD5E0' }} />
                <h3 className="text-[18px] font-semibold text-[#A0AEC0] mb-2">Your dashboard will appear here</h3>
                <p className="text-[14px] text-[#CBD5E0] max-w-md">
                  Fill in your requirements above and click "Generate Dashboard Design" to create a sleek, AI-powered dashboard mockup.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Dashboard Image */}
        {dashboardImage && (
          <div ref={imageSectionRef} className="mb-16">
            <div className="flex items-center gap-2 mb-6">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: DARK_ACCENT_COLOR }}
              >
                2
              </div>
              <h2 className="text-[24px] font-bold text-[#1A202C]">Dashboard Design</h2>
            </div>

            <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 md:p-8 mb-6">
              {/* Edit Mode Toggle */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-[18px] font-bold text-[#1A202C] mb-1">Dashboard Preview</h3>
                  <p className="text-[13px] text-[#718096]">Click "Edit Dashboard" to customize metrics and values</p>
                </div>
                <button
                  onClick={() => {
                    setIsEditingDashboard(!isEditingDashboard);
                    if (!isEditingDashboard && editableMetrics.length === 0) {
                      const metrics = keyMetrics.split(',').map(m => m.trim()).filter(Boolean) || ['Revenue', 'Users', 'Growth', 'Engagement'];
                      setEditableMetrics(metrics.map((name, idx) => ({
                        name,
                        value: Math.floor(Math.random() * 9000 + 1000),
                        change: parseFloat((Math.random() * 20 - 5).toFixed(1)),
                      })));
                    }
                  }}
                  className="px-5 py-2.5 border border-[#D47B5A] text-[#D47B5A] text-[14px] font-semibold rounded-lg hover:bg-[#FFF5F0] transition-colors flex items-center gap-2"
                >
                  <Edit2 size={16} />
                  {isEditingDashboard ? 'Done Editing' : 'Edit Dashboard'}
                </button>
              </div>

              {/* Editable Dashboard Panel */}
              {isEditingDashboard && (
                <div className="mb-6 bg-[#F7FAFC] border border-[#E2E8F0] rounded-xl p-6">
                  <h4 className="text-[16px] font-bold text-[#1A202C] mb-4">Dashboard Settings</h4>
                  
                  <div className="grid md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-[13px] font-semibold text-[#1A202C] mb-2">Dashboard Title</label>
                      <input
                        type="text"
                        value={dashboardTitle}
                        onChange={(e) => {
                          setDashboardTitle(e.target.value);
                          updateDashboard();
                        }}
                        className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-[14px] text-[#1A202C] focus:outline-none focus:border-[#D47B5A] focus:ring-[2px] focus:ring-[#D47B5A1a] bg-white"
                        placeholder="Dashboard"
                      />
                    </div>
                    <div>
                      <label className="block text-[13px] font-semibold text-[#1A202C] mb-2">Subtitle</label>
                      <input
                        type="text"
                        value={dashboardSubtitle}
                        onChange={(e) => {
                          setDashboardSubtitle(e.target.value);
                          updateDashboard();
                        }}
                        className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-[14px] text-[#1A202C] focus:outline-none focus:border-[#D47B5A] focus:ring-[2px] focus:ring-[#D47B5A1a] bg-white"
                        placeholder="Overview & Analytics"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-[#1A202C] mb-3">Metrics</label>
                    <div className="space-y-3">
                      {editableMetrics.map((metric, idx) => (
                        <div key={idx} className="bg-white border border-[#E2E8F0] rounded-lg p-4">
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="block text-[12px] font-medium text-[#718096] mb-1">Metric Name</label>
                              <input
                                type="text"
                                value={metric.name}
                                onChange={(e) => {
                                  const updated = [...editableMetrics];
                                  updated[idx].name = e.target.value;
                                  setEditableMetrics(updated);
                                  updateDashboard();
                                }}
                                className="w-full border border-[#E2E8F0] rounded-lg px-3 py-1.5 text-[13px] text-[#1A202C] focus:outline-none focus:border-[#D47B5A] focus:ring-[2px] focus:ring-[#D47B5A1a] bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-[12px] font-medium text-[#718096] mb-1">Value</label>
                              <input
                                type="number"
                                value={metric.value}
                                onChange={(e) => {
                                  const updated = [...editableMetrics];
                                  updated[idx].value = parseInt(e.target.value) || 0;
                                  setEditableMetrics(updated);
                                  updateDashboard();
                                }}
                                className="w-full border border-[#E2E8F0] rounded-lg px-3 py-1.5 text-[13px] text-[#1A202C] focus:outline-none focus:border-[#D47B5A] focus:ring-[2px] focus:ring-[#D47B5A1a] bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-[12px] font-medium text-[#718096] mb-1">Change %</label>
                              <input
                                type="number"
                                step="0.1"
                                value={metric.change}
                                onChange={(e) => {
                                  const updated = [...editableMetrics];
                                  updated[idx].change = parseFloat(e.target.value) || 0;
                                  setEditableMetrics(updated);
                                  updateDashboard();
                                }}
                                className="w-full border border-[#E2E8F0] rounded-lg px-3 py-1.5 text-[13px] text-[#1A202C] focus:outline-none focus:border-[#D47B5A] focus:ring-[2px] focus:ring-[#D47B5A1a] bg-white"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => {
                        setEditableMetrics([...editableMetrics, { name: 'New Metric', value: 0, change: 0 }]);
                      }}
                      className="mt-3 px-4 py-2 border border-[#E2E8F0] text-[#4A5568] text-[13px] font-semibold rounded-lg hover:bg-[#F7FAFC] transition-colors"
                    >
                      + Add Metric
                    </button>
                  </div>
                </div>
              )}

              {/* Dashboard Display - scaled to fit without clipping */}
              <div className="mb-6">
                <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
                  {dashboardSvg ? (
                    <>
                      {dashboardImage?.html_content ? (
                        <div style={{ position: 'relative', width: '100%', paddingBottom: '66.67%', overflow: 'hidden' }}>
                          <iframe
                            srcDoc={dashboardImage.html_content}
                            className="border-0"
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '1200px',
                              height: '800px',
                              transformOrigin: 'top left',
                            }}
                            title="Generated Dashboard"
                            ref={(el) => {
                              if (el) {
                                const updateScale = () => {
                                  const containerWidth = el.parentElement?.clientWidth || 1200;
                                  const scale = containerWidth / 1200;
                                  el.style.transform = `scale(${scale})`;
                                };
                                updateScale();
                                window.addEventListener('resize', updateScale);
                              }
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-full p-4">
                          <div dangerouslySetInnerHTML={{ __html: dashboardSvg }} />
                        </div>
                      )}
                    </>
                  ) : dashboardImage && dashboardImage.image_url ? (
                    <>
                      {dashboardImage.image_url.startsWith('data:text/html') ? (
                        <div style={{ position: 'relative', width: '100%', paddingBottom: '66.67%', overflow: 'hidden' }}>
                          <iframe
                            srcDoc={decodeURIComponent(dashboardImage.image_url.replace('data:text/html;charset=utf-8,', ''))}
                            className="border-0"
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '1200px',
                              height: '800px',
                              transformOrigin: 'top left',
                            }}
                            title="Generated Dashboard"
                            ref={(el) => {
                              if (el) {
                                const updateScale = () => {
                                  const containerWidth = el.parentElement?.clientWidth || 1200;
                                  const scale = containerWidth / 1200;
                                  el.style.transform = `scale(${scale})`;
                                };
                                updateScale();
                                window.addEventListener('resize', updateScale);
                              }
                            }}
                          />
                        </div>
                      ) : (
                        <div className="flex items-center justify-center bg-[#F8FAFC] p-4">
                          <img
                            src={dashboardImage.image_url}
                            alt="Generated dashboard design"
                            style={{ maxWidth: '100%', height: 'auto', objectFit: 'contain' }}
                          />
                        </div>
                      )}
                    </>
                  ) : null}
                </div>
              </div>

              {/* Image Prompt */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-[14px] font-semibold text-[#1A202C]">
                    Image Generation Prompt
                  </label>
                  {!isEditingPrompt && (
                    <button
                      onClick={handleEditPrompt}
                      className="text-[13px] font-medium text-[#D47B5A] hover:text-[#C06A4A] transition-colors flex items-center gap-1"
                    >
                      <Edit2 size={14} />
                      Edit
                    </button>
                  )}
                </div>

                {isEditingPrompt ? (
                  <div className="space-y-3">
                    <textarea
                      value={editedPrompt}
                      onChange={(e) => setEditedPrompt(e.target.value)}
                      className="w-full border border-[#D47B5A] rounded-lg px-4 py-3 text-[14px] text-[#1A202C] focus:outline-none focus:ring-[3px] focus:ring-[#D47B5A1a] transition-colors resize-none bg-white font-mono"
                      rows={6}
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={handleSavePrompt}
                        disabled={isLoading}
                        className="px-4 py-2 bg-[#D47B5A] text-white text-[14px] font-semibold rounded-lg hover:bg-[#C06A4A] transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        <Check size={16} />
                        Save & Regenerate
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="px-4 py-2 border border-[#E2E8F0] text-[#4A5568] text-[14px] font-semibold rounded-lg hover:bg-[#F7FAFC] transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#F7FAFC] border border-[#E2E8F0] rounded-lg px-4 py-3">
                    <p className="text-[14px] text-[#4A5568] leading-relaxed font-mono whitespace-pre-wrap">
                      {imagePrompt}
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleStartOver}
                  className="px-6 py-3 border border-[#E2E8F0] text-[#4A5568] font-semibold rounded-full hover:bg-[#F7FAFC] transition-colors flex items-center gap-2"
                >
                  <RotateCcw size={18} />
                  Start Over
                </button>
              </div>
            </div>

          </div>
        )}

        {/* PRD Card - Always visible */}
        <div ref={prdSectionRef} className="bg-white border border-[#E2E8F0] rounded-xl p-6 md:p-8 mb-16">
          <div className="flex items-start gap-4 mb-4">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'rgba(245, 184, 160, 0.25)' }}
            >
              <FileText size={20} style={{ color: DARK_ACCENT_COLOR }} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[18px] font-bold text-[#1A202C] mb-1">Product Requirements Document (PRD)</h3>
              <p className="text-[14px] text-[#718096] leading-relaxed">
                A PRD converts your dashboard design into structured specifications that AI coding agents (like <strong>Lovable</strong>, <strong>Bolt.new</strong>, or <strong>V0</strong>) can use to build a fully functional version. It bridges the gap between what you want and what gets built.
              </p>
            </div>
          </div>

          {isPrdLoading ? (
            <div className="flex items-center gap-3 py-4 px-4 bg-[#F7FAFC] rounded-lg">
              <Loader2 size={18} className="animate-spin" style={{ color: DARK_ACCENT_COLOR }} />
              <p className="text-[14px] text-[#718096]">Generating your PRD...</p>
            </div>
          ) : prdResult ? (
            <>
              <div className="flex items-center gap-3 mb-4">
                <button
                  onClick={() => setShowPrdDropdown(!showPrdDropdown)}
                  className="flex items-center gap-2 px-4 py-2.5 border border-[#E2E8F0] text-[#1A202C] text-[14px] font-semibold rounded-lg hover:bg-[#F7FAFC] transition-colors"
                >
                  <ChevronDown
                    size={16}
                    className="transition-transform duration-200"
                    style={{ transform: showPrdDropdown ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  />
                  {showPrdDropdown ? 'Hide PRD' : 'View PRD'}
                </button>
                <button
                  onClick={handleCopyPRD}
                  className="flex items-center gap-2 px-4 py-2.5 text-white text-[14px] font-semibold rounded-lg transition-colors"
                  style={{ backgroundColor: DARK_ACCENT_COLOR }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#C06A4A'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = DARK_ACCENT_COLOR; }}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? 'Copied!' : 'Copy PRD to Clipboard'}
                </button>
              </div>

              {showPrdDropdown && (
                <div className="border border-[#E2E8F0] rounded-xl overflow-hidden">
                  <div className="max-h-[600px] overflow-y-auto p-6 space-y-6">
                    {Object.entries(prdResult.sections).map(([key, value]) => {
                      const sectionTitles: Record<string, string> = {
                        title_and_author: 'Title & Author Information',
                        purpose_and_scope: 'Purpose and Scope',
                        stakeholders: 'Stakeholder Identification',
                        market_assessment: 'Market Assessment and Target Demographics',
                        product_overview: 'Product Overview and Use Cases',
                        functional_requirements: 'Functional Requirements',
                        usability_requirements: 'Usability Requirements',
                        technical_requirements: 'Technical Requirements',
                        environmental_requirements: 'Environmental Requirements',
                        support_requirements: 'Support Requirements',
                        interaction_requirements: 'Interaction Requirements',
                        assumptions: 'Assumptions',
                        constraints: 'Constraints',
                        dependencies: 'Dependencies',
                        workflow_timeline: 'High-Level Workflow Plans, Timelines and Milestones',
                        evaluation_metrics: 'Evaluation Plan and Performance Metrics',
                      };

                      return (
                        <div key={key}>
                          <h4 className="text-[16px] font-bold text-[#1A202C] mb-2">
                            {sectionTitles[key] || key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')}
                          </h4>
                          <div className="bg-[#F7FAFC] border-l-4 rounded-r-lg px-5 py-3" style={{ borderColor: DARK_ACCENT_COLOR }}>
                            <p className="text-[14px] text-[#4A5568] leading-relaxed whitespace-pre-wrap">
                              {value}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-[#F7FAFC] border border-[#E2E8F0] rounded-lg px-4 py-3">
              <p className="text-[14px] text-[#718096]">
                Generate a dashboard above to automatically create your PRD.
              </p>
            </div>
          )}
        </div>

        {/* Closing */}
        <ArtifactClosing
          summaryText="You've designed a dashboard prototype and generated a PRD ready for AI-assisted development."
          ctaLabel="Continue to Level 5: Full AI Applications"
          ctaHref="#product-architecture"
          accentColor={DARK_ACCENT_COLOR}
        />
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#1A202C] text-white text-[14px] px-5 py-2.5 rounded-lg shadow-lg z-50 animate-toast-enter"
          style={{ transform: 'translateX(-50%)' }}
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
};
