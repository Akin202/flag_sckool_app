import { FlagSkoolConfig } from '@/types/index';

export const config: FlagSkoolConfig = {
  brand: {
    inkDeep: '#030617',
    inkRaised: '#0A0F29',
    inkBorder: '#1A2342',
    flagRed: '#CA3A32',
    bodyText: '#CBD5E1',
    mutedText: '#8492A6',
    paperSoft: '#F8FAFC',
  },
  org: {
    name: 'Flag Skool',
    wordmark: 'FLAG SKOOL',
    telegramUrl: 'https://t.me/flagskool',
    xHandle: '@flagskool',
    xUrl: 'https://x.com/flagskool',
    supportEmail: 'admissions@flagskool.com',
    refundPolicyUrl: '#refund-policy',
    instructorName: 'Tobi Adebayo',
  },
  promo: {
    label: 'Cohort 2 Early Access Discount',
    endsAt: '2026-09-15T23:59:59Z',
    discountPercent: 50,
    active: true,
  },
  player: {
    // 480p, never 'auto'. Thirteen two-hour lessons at 720p is ~20GB per
    // student on Nigerian mobile data. Do not raise this default.
    defaultQuality: '480p',
    dataSaverQuality: '360p',
    availableQualities: ['360p', '480p', '720p', '1080p'],
    savePositionEverySeconds: 10,
    markCompleteAtPercent: 90,
  },
  video: {
    signedUrlTtlSeconds: 300,
  },
  copy: {
    heroHeadline: 'Build and Deploy Production AI Systems in Nigeria',
    heroSubline:
      'A practical, project-driven engineering curriculum for Nigerian developers, founders, and technical builders ready to master n8n automations, autonomous agents, RAG architectures, and commercial AI apps.',
    heroMutedStat: 'Taught live to 750+ students.',
    freePreviewCaption: 'Lesson 1 — Fundamentals of AI · Free',
    outcomeBullets: [
      {
        id: 'agents',
        title: 'Autonomous Multi-Step Agents',
        description:
          'Design, execute, and monitor agentic workflows that orchestrate calendar actions, multi-party communications, and tool calling reliably.',
        iconName: 'bot',
      },
      {
        id: 'automation',
        title: 'Production n8n & Pipeline Architecture',
        description:
          'Build self-healing enterprise email processors, webhook responders, and data scrapers connected directly to LLM backends.',
        iconName: 'workflow',
      },
      {
        id: 'shipping',
        title: 'Commercial AI Products & RAG',
        description:
          'Implement vector retrieval pipelines over Nigerian financial & legal docs, and ship vibe-coded full-stack web products with Lovable and custom backends.',
        iconName: 'rocket',
      },
    ],
    auth: {
      login: {
        title: 'Sign In to Student Portal',
        subtitle:
          'Access your lecture recordings, n8n templates, and live weekend sessions.',
      },
      signup: {
        title: 'Create Student Account',
        subtitle:
          'Join 750+ Nigerian engineers mastering autonomous agents & enterprise AI workflows.',
      },
      forgot: { title: 'Reset Password' },
      reset: { title: 'Set New Password' },
      verifyEmail: { title: 'Verify Email Address' },
    },
    instructorBioParagraphs: [
      '// TODO(handoff): Replace with final verified instructor bio from leadership team.',
      'Lead AI Engineer and Systems Architect with 8+ years building distributed backends, LLM agents, and automated data pipelines across Lagos and international tech ecosystems. Passionate about equipping West African engineers with world-class, commercial AI tooling.',
    ],
  },
  pricing: {
    recordings: {
      id: 'recordings',
      name: 'On-Demand Recordings',
      tag: 'Self-Paced',
      fullPriceNgn: 100000,
      promoPriceNgn: 50000,
      isPremium: false,
      description: 'Immediate lifetime access to all Cohort 1 video lectures, code repositories, and automation blueprints.',
      features: [
        'All 6 deep-dive curriculum modules (15+ hours)',
        'Full n8n workflow JSON blueprints and agent templates',
        'Direct access to downloadable code repositories & slides',
        'Access to our private Telegram technical community',
        'Self-paced with unlimited lifetime recording access',
      ],
      ctaText: 'Get instant recordings access',
      footnote: 'One-time payment · Instant access via Telegram and portal',
    },
    cohort: {
      id: 'cohort',
      name: 'Live Cohort 2 + Complete Archive',
      tag: 'Most Recommended',
      fullPriceNgn: 150000,
      promoPriceNgn: 100000,
      isPremium: true,
      description: 'Live interactive weekend masterclasses, weekly office hours, code reviews, plus the entire Cohort 1 archive.',
      features: [
        'Includes EVERY Cohort 1 recording and resource package',
        '6 weeks of live weekend interactive build sessions',
        'Weekly 1-on-1 and small group code & architecture reviews',
        'Dedicated project capstone evaluation & portfolio certification',
        'VIP Telegram cohort channel with direct instructor access',
        'Job board & client referral priority for top capstone projects',
      ],
      ctaText: 'Enroll in Live Cohort 2',
      footnote: 'Limited to 150 seats for high-touch instructor feedback',
    },
  },
};
