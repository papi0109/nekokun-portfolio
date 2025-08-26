/**
 * Google Apps Script Web App endpoint (GET only).
 * Returns portfolio data as JSON. Initially hard-coded, mirroring local-server.js.
 */

/**
 * GET handler
 * @param {GoogleAppsScript.Events.DoGet} e
 * @return {GoogleAppsScript.Content.TextOutput}
 */
function doGet(e) {
  var data = getPortfolioData_();
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Hard-coded portfolio data.
 * Replace with your real content or a Spreadsheet/Docs source.
 * @return {Object}
 */
function getPortfolioData_() {
  return {
    profile: {
      name: 'ねこくん',
      title: '自称PM/PL・自称AIエンジニア・自称フルサイクルエンジニア',
      summary: 'パフォーマンスと開発体験を重視し、クリーンでアクセシブル、保守しやすい Web をつくります。',
      contacts: {
        email: 'your.name@example.com',
        github: 'https://github.com/your-github',
        linkedin: 'https://www.linkedin.com/in/your-linkedin'
      }
    },
    skills: {
      languages: ['TypeScript', 'JavaScript', 'Python'],
      frameworks: ['React', 'Next.js', 'Fastify'],
      tools: ['Git', 'Docker', 'Terraform'],
      clouds: ['GCP', 'Vercel', 'Cloudflare']
    },
    careers: [
      {
        period: '2019 — 2020',
        title: 'フロントエンドエンジニア',
        industry: 'toC向けWebサービス / インターネット業界',
        description: [
          'フロント設計・実装・運用',
          'パフォーマンス/アクセシビリティ改善',
          'デザインシステム導入'
        ],
        languages: ['TypeScript', 'JavaScript'],
        tools: ['React', 'Next.js', 'Vite']
      },
      {
        period: '2020 — 2021',
        title: 'バックエンドエンジニア',
        industry: 'SaaS / B2B',
        description: [
          'BFF/API 設計・実装',
          '監視・アラート整備',
          'DB チューニング'
        ],
        languages: ['TypeScript', 'Python'],
        tools: ['Node.js', 'Fastify', 'PostgreSQL']
      },
      {
        period: '2021 — 2022',
        title: 'DevOps エンジニア',
        industry: 'クラウド / SRE',
        description: [
          'CI/CD パイプライン整備',
          'IaC による構成管理',
          'コンテナ運用'
        ],
        languages: ['Bash', 'TypeScript'],
        tools: ['Docker', 'Terraform', 'GitHub Actions']
      },
      {
        period: '2022 — 2024',
        title: 'フルスタックエンジニア',
        industry: '業務システム / 内製開発',
        description: [
          'GAS による社内自動化',
          'フロント〜APIまで一貫開発',
          '品質改善と運用効率化'
        ],
        languages: ['TypeScript', 'Python'],
        tools: ['GAS', 'Node.js', 'Docker']
      }
    ],
    links: [
      { title: 'GitHub', desc: 'コードとリポジトリはこちら', href: 'https://github.com/your-github', image: 'assets/images/nekokun.jpeg' },
      { title: 'LinkedIn', desc: '職務経歴とネットワーク', href: 'https://www.linkedin.com/in/your-linkedin', image: 'assets/images/nekokun.jpeg' },
      { title: 'Blog', desc: '技術メモや発信', href: '#', image: 'assets/images/nekokun.jpeg' },
      { title: 'X(Twitter)', desc: '日々のつぶやき', href: '#', image: 'assets/images/nekokun.jpeg' }
    ]
  };
}
