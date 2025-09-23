
// Template configuration types
export interface TemplateConfig {
  id: number;
  name: string;
  description: string;
  category: 'basic' | 'premium';
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background?: string;
  };
  layout: 'left' | 'center' | 'right' | 'split' | 'modern' | 'executive' | 'sidebar';
  gradient?: string;
  features: string[];
  positioning?: {
    headerStyle?: 'standard' | 'floating' | 'banner' | 'minimal';
    logoPosition?: 'left' | 'right' | 'center';
    totalPosition?: 'right' | 'left' | 'center' | 'highlight';
    itemsLayout?: 'standard' | 'cards' | 'minimal' | 'modern';
  };
}

// Template configurations
export const templateConfigs: Record<number, TemplateConfig> = {
  // Basic Templates (Free Users)
  1: {
    id: 1,
    name: 'Classic Business',
    description: 'Clean and professional design perfect for traditional businesses',
    category: 'basic',
    colors: {
      primary: '#2c3e50',
      secondary: '#7f8c8d',
      accent: '#3498db'
    },
    layout: 'center',
    features: ['Clean Layout', 'Professional Typography']
  },
  2: {
    id: 2,
    name: 'Modern Minimal',
    description: 'Simple and contemporary design with clean lines',
    category: 'basic',
    colors: {
      primary: '#34495e',
      secondary: '#95a5a6',
      accent: '#e74c3c'
    },
    layout: 'left',
    features: ['Minimal Design', 'Easy to Read']
  },
  3: {
    id: 3,
    name: 'Corporate Blue',
    description: 'Traditional corporate styling in professional blue',
    category: 'basic',
    colors: {
      primary: '#1e3a8a',
      secondary: '#64748b',
      accent: '#0ea5e9'
    },
    layout: 'center',
    features: ['Corporate Style', 'Professional Colors']
  },
  4: {
    id: 4,
    name: 'Clean Gray',
    description: 'Neutral gray design suitable for any industry',
    category: 'basic',
    colors: {
      primary: '#374151',
      secondary: '#9ca3af',
      accent: '#6b7280'
    },
    layout: 'left',
    features: ['Neutral Colors', 'Versatile Design']
  },
  5: {
    id: 5,
    name: 'Simple Green',
    description: 'Fresh green design perfect for eco-friendly businesses',
    category: 'basic',
    colors: {
      primary: '#065f46',
      secondary: '#6b7280',
      accent: '#10b981'
    },
    layout: 'center',
    features: ['Eco-Friendly', 'Fresh Colors']
  },

  // Premium Templates (Paid Users)
  6: {
    id: 6,
    name: 'Executive Elite',
    description: 'Luxury design with premium gradients and sophisticated styling',
    category: 'premium',
    colors: {
      primary: '#1a202c',
      secondary: '#4a5568',
      accent: '#f56565',
      background: '#f7fafc'
    },
    layout: 'executive',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    features: ['Executive Layout', 'Premium Typography', 'Gradient Headers', 'Luxury Styling'],
    positioning: {
      headerStyle: 'banner',
      logoPosition: 'right',
      totalPosition: 'highlight',
      itemsLayout: 'cards'
    }
  },
  7: {
    id: 7,
    name: 'Golden Enterprise',
    description: 'Elegant gold and black design for high-end businesses',
    category: 'premium',
    colors: {
      primary: '#2d3748',
      secondary: '#4a5568',
      accent: '#d69e2e',
      background: '#fffaf0'
    },
    layout: 'sidebar',
    gradient: 'linear-gradient(135deg, #d69e2e 0%, #f6e05e 100%)',
    features: ['Sidebar Layout', 'Gold Accents', 'Luxury Feel', 'Premium Design'],
    positioning: {
      headerStyle: 'floating',
      logoPosition: 'left',
      totalPosition: 'highlight',
      itemsLayout: 'minimal'
    }
  },
  8: {
    id: 8,
    name: 'Tech Innovation',
    description: 'Futuristic design with tech-inspired elements',
    category: 'premium',
    colors: {
      primary: '#2d3748',
      secondary: '#4a5568',
      accent: '#4299e1',
      background: '#f7fafc'
    },
    layout: 'split',
    gradient: 'linear-gradient(135deg, #4299e1 0%, #3182ce 100%)',
    features: ['Split Layout', 'Tech Styling', 'Futuristic Design', 'Gradient Panels'],
    positioning: {
      headerStyle: 'minimal',
      logoPosition: 'center',
      totalPosition: 'highlight',
      itemsLayout: 'cards'
    }
  },
  9: {
    id: 9,
    name: 'Royal Purple',
    description: 'Regal purple design conveying luxury and sophistication',
    category: 'premium',
    colors: {
      primary: '#553c9a',
      secondary: '#4a5568',
      accent: '#9f7aea',
      background: '#faf5ff'
    },
    layout: 'modern',
    gradient: 'linear-gradient(135deg, #9f7aea 0%, #805ad5 100%)',
    features: ['Modern Layout', 'Royal Colors', 'Elegant Design', 'Premium Styling'],
    positioning: {
      headerStyle: 'floating',
      logoPosition: 'center',
      totalPosition: 'highlight',
      itemsLayout: 'modern'
    }
  },
  10: {
    id: 10,
    name: 'Emerald Luxury',
    description: 'Sophisticated emerald design for premium brands',
    category: 'premium',
    colors: {
      primary: '#2f855a',
      secondary: '#4a5568',
      accent: '#48bb78',
      background: '#f0fff4'
    },
    layout: 'executive',
    gradient: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)',
    features: ['Executive Layout', 'Emerald Theme', 'Luxury Appeal', 'Premium Design'],
    positioning: {
      headerStyle: 'banner',
      logoPosition: 'right',
      totalPosition: 'highlight',
      itemsLayout: 'cards'
    }
  },
  11: {
    id: 11,
    name: 'Crimson Executive',
    description: 'Bold crimson design for powerful business presence',
    category: 'premium',
    colors: {
      primary: '#7f1d1d',
      secondary: '#525252',
      accent: '#dc2626',
      background: '#fef2f2'
    },
    layout: 'center',
    gradient: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
    features: ['Bold Colors', 'Executive Style', 'Power Design']
  },
  12: {
    id: 12,
    name: 'Platinum Professional',
    description: 'Ultra-premium platinum design with metallic accents',
    category: 'premium',
    colors: {
      primary: '#1f2937',
      secondary: '#6b7280',
      accent: '#e5e7eb',
      background: '#f9fafb'
    },
    layout: 'left',
    gradient: 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)',
    features: ['Metallic Accents', 'Ultra-Premium', 'Platinum Theme']
  },
  13: {
    id: 13,
    name: 'Sapphire Elite',
    description: 'Deep sapphire blue with diamond-like clarity',
    category: 'premium',
    colors: {
      primary: '#1e3a8a',
      secondary: '#475569',
      accent: '#3b82f6',
      background: '#eff6ff'
    },
    layout: 'center',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    features: ['Sapphire Colors', 'Crystal Clear', 'Elite Design']
  },
  14: {
    id: 14,
    name: 'Rose Gold Luxury',
    description: 'Elegant rose gold design for feminine luxury brands',
    category: 'premium',
    colors: {
      primary: '#881337',
      secondary: '#64748b',
      accent: '#f43f5e',
      background: '#fdf2f8'
    },
    layout: 'right',
    gradient: 'linear-gradient(135deg, #f43f5e 0%, #ec4899 100%)',
    features: ['Rose Gold', 'Feminine Touch', 'Luxury Appeal']
  },
  15: {
    id: 15,
    name: 'Carbon Fiber',
    description: 'Industrial carbon fiber texture for modern enterprises',
    category: 'premium',
    colors: {
      primary: '#0f172a',
      secondary: '#334155',
      accent: '#64748b',
      background: '#1e293b'
    },
    layout: 'left',
    gradient: 'linear-gradient(135deg, #334155 0%, #475569 100%)',
    features: ['Carbon Texture', 'Industrial Design', 'Modern Appeal']
  },
  16: {
    id: 16,
    name: 'Ocean Depths',
    description: 'Deep ocean-inspired design with flowing gradients',
    category: 'premium',
    colors: {
      primary: '#164e63',
      secondary: '#475569',
      accent: '#0891b2',
      background: '#f0f9ff'
    },
    layout: 'center',
    gradient: 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)',
    features: ['Ocean Theme', 'Flowing Design', 'Depth Effects']
  },
  17: {
    id: 17,
    name: 'Midnight Aurora',
    description: 'Dark theme with aurora-inspired gradients',
    category: 'premium',
    colors: {
      primary: '#0c0a09',
      secondary: '#292524',
      accent: '#06b6d4',
      background: '#1c1917'
    },
    layout: 'left',
    gradient: 'linear-gradient(135deg, #06b6d4 0%, #8b5cf6 50%, #f59e0b 100%)',
    features: ['Aurora Effects', 'Dark Theme', 'Multi-Color Gradient']
  },
  18: {
    id: 18,
    name: 'Copper Elegance',
    description: 'Warm copper tones with sophisticated styling',
    category: 'premium',
    colors: {
      primary: '#7c2d12',
      secondary: '#525252',
      accent: '#ea580c',
      background: '#fff7ed'
    },
    layout: 'right',
    gradient: 'linear-gradient(135deg, #ea580c 0%, #dc2626 100%)',
    features: ['Copper Tones', 'Warm Colors', 'Elegant Style']
  },
  19: {
    id: 19,
    name: 'Compact Professional',
    description: 'Ultra-compact premium design with perfect typography and spacing',
    category: 'premium',
    colors: {
      primary: '#1e293b',
      secondary: '#64748b',
      accent: '#3b82f6',
      background: '#ffffff'
    },
    layout: 'modern',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
    features: ['Compact Layout', 'Premium Typography', 'Perfect Spacing', 'Modern Design', 'Mobile Optimized'],
    positioning: {
      headerStyle: 'minimal',
      logoPosition: 'left',
      totalPosition: 'highlight',
      itemsLayout: 'minimal'
    }
  }
};

export const getTemplateConfig = (templateId: number): TemplateConfig => {
  return templateConfigs[templateId] || templateConfigs[1];
};
