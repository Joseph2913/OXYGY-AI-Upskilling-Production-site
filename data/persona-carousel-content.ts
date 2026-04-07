import type { PersonaCardData } from '../types';

export const PERSONAS: PersonaCardData[] = [
  {
    id: 1,
    title: 'The Curious Beginner',
    accentColor: '#C3D0F5',
    front: {
      whereIAm: "I\u2019ve heard a lot about AI but haven\u2019t really used it beyond the occasional ChatGPT experiment. I know it\u2019s important \u2014 I just don\u2019t know where to start.",
      whereImGoing: "I want to feel confident using AI in my everyday work \u2014 drafting, research, planning \u2014 without second-guessing myself.",
    },
    back: {
      pathway: [
        { level: 'L1', depth: 'full', color: '#B2D8F7' },
        { level: 'L2', depth: 'awareness', color: '#C3D0F5' },
        { level: 'L3', depth: 'skip', color: '#F7E8A4' },
        { level: 'L4', depth: 'skip', color: '#F5B8A0' },
        { level: 'L5', depth: 'skip', color: '#38B2AC' },
      ],
      projectTitle: 'Build a Personal Prompt Toolkit',
      projectDescription: "Create a library of 10+ reusable prompts tailored to your daily tasks \u2014 from email drafting to meeting prep to research summaries. Your team can use it too.",
      estimatedJourney: '~3 weeks at 2\u20133 hours/week',
    },
  },
  {
    id: 2,
    title: 'The Everyday User',
    accentColor: '#B2D8F7',
    front: {
      whereIAm: "I use ChatGPT regularly for drafting and brainstorming \u2014 it saves me time every day. But I know I\u2019m barely scratching the surface of what\u2019s possible.",
      whereImGoing: "I want to move beyond basic prompting and start building tools my team can actually reuse without needing me.",
    },
    back: {
      pathway: [
        { level: 'L1', depth: 'fast-track', color: '#B2D8F7' },
        { level: 'L2', depth: 'full', color: '#C3D0F5' },
        { level: 'L3', depth: 'awareness', color: '#F7E8A4' },
        { level: 'L4', depth: 'skip', color: '#F5B8A0' },
        { level: 'L5', depth: 'skip', color: '#38B2AC' },
      ],
      projectTitle: 'Build a Team Brief Generator Agent',
      projectDescription: "Design a custom GPT that takes raw meeting notes or project inputs and produces structured briefs your colleagues can use independently.",
      estimatedJourney: '~5 weeks at 3\u20134 hours/week',
    },
  },
  {
    id: 3,
    title: 'The Strategic Leader',
    accentColor: '#F7E8A4',
    front: {
      whereIAm: "I understand AI\u2019s potential and I champion it for my team \u2014 but I haven\u2019t had the time to get hands-on. My team looks to me for direction on what to invest in.",
      whereImGoing: "I want to know enough to set the right AI strategy, evaluate tools confidently, and lead by example.",
    },
    back: {
      pathway: [
        { level: 'L1', depth: 'full', color: '#B2D8F7' },
        { level: 'L2', depth: 'full', color: '#C3D0F5' },
        { level: 'L3', depth: 'awareness', color: '#F7E8A4' },
        { level: 'L4', depth: 'skip', color: '#F5B8A0' },
        { level: 'L5', depth: 'skip', color: '#38B2AC' },
      ],
      projectTitle: 'Design an AI Adoption Playbook',
      projectDescription: "Build a structured guide for your team that maps AI tools to real workflows, includes responsible use guidelines, and features a starter set of custom agents.",
      estimatedJourney: '~6 weeks at 2\u20133 hours/week',
    },
  },
  {
    id: 4,
    title: 'The Hands-On Builder',
    accentColor: '#F5B8A0',
    front: {
      whereIAm: "I\u2019ve already created custom GPTs and prompt templates that my team uses daily. I\u2019m comfortable building \u2014 now I want to connect things together.",
      whereImGoing: "I want to design end-to-end AI workflows that automate real processes, not just individual tasks.",
    },
    back: {
      pathway: [
        { level: 'L1', depth: 'skip', color: '#B2D8F7' },
        { level: 'L2', depth: 'fast-track', color: '#C3D0F5' },
        { level: 'L3', depth: 'full', color: '#F7E8A4' },
        { level: 'L4', depth: 'awareness', color: '#F5B8A0' },
        { level: 'L5', depth: 'skip', color: '#38B2AC' },
      ],
      projectTitle: 'Automate a Multi-Step Reporting Pipeline',
      projectDescription: "Connect your existing AI agents into a workflow that collects data, processes it through AI, generates a tailored report, and delivers it automatically.",
      estimatedJourney: '~5 weeks at 3\u20134 hours/week',
    },
  },
  {
    id: 5,
    title: 'The Process Optimizer',
    accentColor: '#38B2AC',
    front: {
      whereIAm: "I\u2019ve started connecting AI tools to workflows \u2014 but it\u2019s still fragile and manual. The outputs end up in spreadsheets that only I understand.",
      whereImGoing: "I want to build robust automated pipelines with proper dashboards that my stakeholders can actually use without my help.",
    },
    back: {
      pathway: [
        { level: 'L1', depth: 'skip', color: '#B2D8F7' },
        { level: 'L2', depth: 'fast-track', color: '#C3D0F5' },
        { level: 'L3', depth: 'full', color: '#F7E8A4' },
        { level: 'L4', depth: 'full', color: '#F5B8A0' },
        { level: 'L5', depth: 'skip', color: '#38B2AC' },
      ],
      projectTitle: 'Build a Live Insights Dashboard',
      projectDescription: "Design and prototype an interactive dashboard that reads from your automated AI pipeline and presents real-time insights tailored to different stakeholder roles.",
      estimatedJourney: '~7 weeks at 3\u20134 hours/week',
    },
  },
  {
    id: 6,
    title: 'The Product Thinker',
    accentColor: '#E6FFFA',
    front: {
      whereIAm: "I\u2019ve built workflows and prototyped dashboards \u2014 now I want to go further. I think in terms of products, not just tools.",
      whereImGoing: "I want to ship a real AI-powered application where different users get personalized experiences.",
    },
    back: {
      pathway: [
        { level: 'L1', depth: 'skip', color: '#B2D8F7' },
        { level: 'L2', depth: 'skip', color: '#C3D0F5' },
        { level: 'L3', depth: 'fast-track', color: '#F7E8A4' },
        { level: 'L4', depth: 'full', color: '#F5B8A0' },
        { level: 'L5', depth: 'full', color: '#38B2AC' },
      ],
      projectTitle: 'Launch a Personalized Internal Platform',
      projectDescription: "Build and deploy a complete AI application \u2014 with user accounts, role-based views, and personalized content \u2014 that your organization can actually use.",
      estimatedJourney: '~8 weeks at 4\u20135 hours/week',
    },
  },
];
