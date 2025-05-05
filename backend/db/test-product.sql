INSERT INTO public.products (
    id,
    name,
    description,
    price,
    category,
    thumbnail,
    price_type,
    currency,
    features
) VALUES (
    '123e4567-e89b-12d3-a456-426614174000',
    'Focus Enhancement AI',
    'An AI-powered tool to help you maintain focus and concentration during work sessions.',
    2999,
    'Focus & Concentration',
    'https://picsum.photos/800/400',
    'subscription',
    'USD',
    ARRAY[
        'Real-time focus tracking',
        'Personalized concentration exercises',
        'Break time recommendations',
        'Progress analytics'
    ]
); 