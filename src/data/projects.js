// Shared projects data — used by homepage Selected Works + case study Other Works sections
// The first 5 entries are the curated set used by OtherWorksSection logic in CaseStudy.jsx.
// Homepage always shows the first 4 via projects.slice(0, 4).

const projects = [
  {
    slug: 'capitalcom-app-evolution',
    title: 'Capital.com App: Visual Design Evolution',
    subtitle: 'Visual Design, Design Systems',
    image: '/images/thumb-capital-revamp.jpg',
    password: 'hellotoby',
    available: true
  },
  {
    slug: 'capitalcom-ai-graphics',
    title: 'Customising GPT to Scale Design Ops',
    subtitle: 'Product Lead, Web App',
    image: '/images/thumb-custom-gpt.jpg',
    password: 'hellotoby',
    available: true
  },
  {
    slug: 'livi-app-revamp',
    title: 'livi App Revamp',
    subtitle: 'Product Design, App',
    image: '/images/thumb-livi-revamp.jpg',
    available: true
  },
  {
    slug: 'livi-invest',
    title: 'livi Invest',
    subtitle: 'Product Design, App',
    image: '/images/livi-invest.jpg',
    available: true
  },
  {
    slug: 'livi-paylater',
    title: 'livi PayLater',
    subtitle: 'Product Design, App',
    image: '/images/livi-paylater.jpg',
    available: true
  },
  {
    slug: 'inkstone-news',
    title: 'Inkstone News',
    subtitle: 'UI/UX, Website, App',
    image: '/images/inkstone.jpg',
    available: true
  },
  {
    slug: 'scmp-cooking',
    title: 'SCMP Cooking',
    subtitle: 'Product Design, Website',
    image: '/images/scmp-cooking.jpg',
    available: true
  }
];

export default projects;
