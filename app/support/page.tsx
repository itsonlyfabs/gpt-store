import Sidebar from '@/components/Sidebar'
import dynamic from 'next/dynamic'

interface FAQ {
  question: string
  answer: string
  category: string
}

interface DocumentationLink {
  title: string
  description: string
  url: string
  toolId: string
}

// Mock FAQs for development
const MOCK_FAQS: FAQ[] = [
  {
    question: 'How do I get started with the Focus Enhancement AI?',
    answer: 'Start by accessing the tool from your library. The AI will guide you through an initial assessment to understand your focus patterns and customize its approach.',
    category: 'Getting Started',
  },
  {
    question: 'What is the difference between subscription and one-time purchase?',
    answer: 'Subscription provides ongoing access to the AI tool with regular updates and improvements. One-time purchase gives you permanent access to the current version.',
    category: 'Billing',
  },
  {
    question: 'Can I use the tools offline?',
    answer: 'Our AI tools require an internet connection to function as they process data on our secure servers.',
    category: 'Technical',
  },
  {
    question: 'How is my data protected?',
    answer: 'We use industry-standard encryption and never share your personal data. All conversations are private and securely stored.',
    category: 'Privacy & Security',
  },
]

// Mock documentation links for development
const MOCK_DOCUMENTATION = [
  {
    id: 'mock1',
    title: 'Focus Enhancement AI Guide',
    description: 'Learn how to maximize your productivity with our focus enhancement tool.',
    url: '/docs/focus-enhancement',
  },
  {
    id: 'mock2',
    title: 'Meditation Guide AI Documentation',
    description: 'Detailed guide on using our meditation AI for mindfulness practice.',
    url: '/docs/meditation-guide',
  },
];

const faqs = [
  {
    question: 'What can I do with Genio?',
    answer: 'You can set goals, track your progress, analyze your usage, and get personalized guidance to help you grow and succeed. The platform brings together analytics, coaching, and resources to support your journey.'
  },
  {
    question: 'Do you offer a free trial?',
    answer: 'Better! We offer free subscription to the platform with limited credit so that you can try it out for yourself. Simply sign up, set your first goal, and explore the dashboard. Use the onboarding chat assistant if you have any questions or need a quick tour of the features.'
  },
  {
    question: 'What are the main features of the platform?',
    answer: 'Key features include:\n- Personalized analytics dashboard\n- Product usage tracking\n- Goal setting and AI coaching\n- Resource library with guides and tips\n- Secure account management\n- Mobile-friendly design\n- Instant support via chat assistant'
  },
  {
    question: 'How can I track my progress or results?',
    answer: 'Your dashboard shows your progress and usage trends. Check it regularly to see how you\'re doing and where you can improve and use the Goal Setting and AI-Coach to correct your direction!'
  },
  {
    question: 'Is my data secure and private?',
    answer: 'Yes! We use industry-standard security practices to keep your data safe and private. You control your account and can update or delete your information at any time.'
  },
  {
    question: 'How do I get help if I\'m stuck?',
    answer: 'Click the chat bubble in the bottom-right corner to talk to the onboarding assistant. You can also visit our support page or check the resource library for guides and FAQs.'
  },
  {
    question: 'Can I use the platform on mobile devices?',
    answer: 'Absolutely! The platform is fully responsive and works on smartphones, tablets, and desktops—so you can stay productive anywhere.'
  },
  {
    question: 'How do I upgrade or manage my subscription?',
    answer: 'Go to your account settings and select "Subscription." From there, you can upgrade, downgrade, or manage your plan at any time.'
  },
  {
    question: 'What should I do if I encounter a bug or issue?',
    answer: 'Please report any bugs using the chat assistant or the support page. Our team will investigate and get back to you as soon as possible.'
  },
  {
    question: 'How can I get the most out of the platform over time?',
    answer: 'Set clear goals, check your analytics regularly, explore new resources, and use the chat assistant whenever you have questions. Consistent use leads to better results and ongoing growth. New products and bundles come out every week!'
  },
]

const DocumentationSection = dynamic(() => import('./DocumentationSection'), { ssr: false });
const SupportClientSection = dynamic(() => import('./SupportClientSection'), { ssr: false });

export default function SupportPage() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-8 pt-20 md:pt-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Support Center</h1>
          <DocumentationSection />
          <SupportClientSection />
        </div>
      </main>
    </div>
  );
} 