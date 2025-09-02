import { NextResponse } from 'next/server';
import { getTopicSuggestions } from '@/app/actions';
export async function POST(req) {
    try {
        const { categoryName } = await req.json();
        if (!categoryName) {
            return NextResponse.json({ error: 'Category name is required.' }, { status: 400 });
        }
        console.log('API: Getting suggestions for category:', categoryName);
        // Add timeout for the entire operation
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('API timeout')), 30000); // 30 second timeout
        });
        const suggestionsPromise = getTopicSuggestions(categoryName);
        const suggestions = await Promise.race([suggestionsPromise, timeoutPromise]);
        console.log('API: Generated suggestions:', suggestions);
        return NextResponse.json({ suggestions });
    }
    catch (error) {
        console.error('Suggestions API Error:', error);
        // Return fallback suggestions instead of empty array
        const fallbackSuggestions = [
            'What are the key points of this policy?',
            'How does this apply to employees?',
            'What are the requirements?'
        ];
        return NextResponse.json({
            error: error.message || 'Internal server error.',
            suggestions: fallbackSuggestions
        }, { status: 500 });
    }
}
//# sourceMappingURL=route.js.map